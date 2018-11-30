const { promisify } = require('util');
const AWS = require('aws-sdk');

const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi.js');
const { doesLambdaExist, doesApiExist } = require('../aws/doesResourceExist');
const getLambda = require('../aws/getLambda');
const { validateApiMethods } = require('../util/validations');
const getRegion = require('../util/getRegion');
const createApiGatewayIntegration = require('../aws/createApiGatewayIntegration');

const bamBam = require('../util/bamBam');

const apiVersion = 'latest';



const {
  writeLambda,
  promisifiedRimraf,
  exists,
  rename,
  readFuncLibrary,
} = require('../util/fileUtils');

const {
  bamLog,
  bamWarn,
  bamError,
} = require('../util/logger');

const stageName = 'bam';

// redeploys lambda that already exists on AWS, whether or not local directory exists
module.exports = async function redeploy(lambdaName, path, options) { // currently updates code only (not role)
  const httpMethods = options.methods ? options.methods.map(method => method.toUpperCase()) : ['GET'];
  const invalidApiMsg = validateApiMethods(httpMethods);

  if (invalidApiMsg) {
    bamWarn(invalidApiMsg);
    return;
  }

  if (!lambdaName) {
    bamError('bam redeploy [lambdaName]: lambdaName must be the name of a .js file in the current directory');
    return;
  }
  // check if lambdaName.js exists in current working dir
  const cwd = process.cwd();
  const existsInCwd = await exists(`${cwd}/${lambdaName}.js`);
  if (!existsInCwd) {
    bamError(`No such file ${lambdaName}.js in current directory ${cwd}`);
    return;
  }

  // check if lambdaName in AWS
  const existsCloud = await doesLambdaExist(lambdaName);

  if (!existsCloud) {
    bamWarn(`Function "${lambdaName}" not found on AWS. Recommend using "bam deploy ${lambdaName}" instead of redeploy`);
    return;
  }

  // check if lambdaName in ~/.bam/functions
  const existsLocally = await exists(`${path}/.bam/functions/${lambdaName}`);

  // helper methods
  const region = await getRegion();
  const api = new AWS.APIGateway({ apiVersion, region });
  const asyncCreateDeployment = promisify(api.createDeployment.bind(api));
  const asyncGetResources = promisify(api.getResources.bind(api));

  // overwrite local deployment package if redeploy successful
  const overwriteLocalPkg = async () => {
    if (existsLocally) await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}`);
    await rename(`${path}/.bam/functions/${lambdaName}-temp`, `${path}/.bam/functions/${lambdaName}`);
  };

  // write to library if lambda was not locally tracked
  const syncLocalToCloudLambda = async () => {
    if (!existsLocally) {
      const { Configuration } = await getLambda(lambdaName);
      await writeLambda(Configuration, path);
    }
  };

  // create and integrate fresh new api gateway if lambda is not locally tracked
  // or if lambda exists locally but api doesn't exist in cloud
  const getApiId = async () => {
    const library = await readFuncLibrary(path);
    return library[lambdaName] && library[lambdaName].api && library[lambdaName].api.restApiId;
  };

  const provideNewApiOrIntegrations = async () => {
    const restApiId = await getApiId();
    const apiExists = await doesApiExist(restApiId);

    if (!existsLocally || !restApiId || !apiExists) {
      await deployApi(lambdaName, path, httpMethods, stageName);
    } else {
      const resources = (await asyncGetResources({ restApiId })).items;
      const resource = resources.find(resource => resource.pathPart === lambdaName);
      const resourceId = resource.id;
      const resourceMethods = Object.keys(resource.resourceMethods);
      for (let i = 0; i < httpMethods.length; i += 1) {
        const httpMethod = httpMethods[i];
        if (!resourceMethods.includes(httpMethod)) {
          const params = [httpMethod, resourceId, restApiId, lambdaName, path];
          await bamBam(createApiGatewayIntegration, { params, retryError: 'TooManyRequestsException' });
        }
      }
      await bamBam(asyncCreateDeployment, { params: [{ restApiId, stageName }], retryError: 'TooManyRequestsException' });
    }
  };

  // revert to prior state (i.e. remove temp package) if AWS error
  const revertToPriorState = async () => {
    await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}-temp`);
  };

  // update lambda code
  const data = await updateLambda(lambdaName, path, options.db);

  if (data) {
    await overwriteLocalPkg();
    await syncLocalToCloudLambda(); // lambda should be written to lib by now
    await provideNewApiOrIntegrations();
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    await revertToPriorState();
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud. Reverted to previous local state`);
  }
};
