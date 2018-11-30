const { promisify } = require('util');
const AWS = require('aws-sdk');

const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi.js');
const { doesApiExist } = require('../aws/doesResourceExist');
const getLambda = require('../aws/getLambda');
const { validateApiMethods, validateLambdaReDeployment } = require('../util/validations');
const getRegion = require('../util/getRegion');
const createApiGatewayIntegration = require('../aws/createApiGatewayIntegration');
const bamBam = require('../util/bamBam');

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

const apiVersion = 'latest';
const stageName = 'bam';

// INFO: currently updates code only (not role)
module.exports = async function redeploy(lambdaName, path, options) {
  // validations
  const invalidLambdaMsg = await validateLambdaReDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const httpMethods = options.methods ? options.methods.map(method => method.toUpperCase()) : ['GET'];
  const invalidApiMsg = validateApiMethods(httpMethods);
  if (invalidApiMsg) {
    bamWarn(invalidApiMsg);
    return;
  }

  // helper methods
  const existsLocally = await exists(`${path}/.bam/functions/${lambdaName}`);
  const region = await getRegion();
  const api = new AWS.APIGateway({ apiVersion, region });
  const asyncCreateDeployment = promisify(api.createDeployment.bind(api));
  const asyncGetResources = promisify(api.getResources.bind(api));

  const overwriteLocalPkg = async () => {
    if (existsLocally) await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}`);
    await rename(`${path}/.bam/functions/${lambdaName}-temp`, `${path}/.bam/functions/${lambdaName}`);
  };

  const syncLocalToCloudLambda = async () => {
    if (!existsLocally) {
      const { Configuration } = await getLambda(lambdaName);
      await writeLambda(Configuration, path);
    }
  };

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
      const resource = resources.find(awsResource => awsResource.pathPart === lambdaName);
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

  const revertToPriorState = async () => {
    await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}-temp`);
  };

  // redeploy sequence
  const data = await updateLambda(lambdaName, path);

  if (data) {
    await overwriteLocalPkg();
    await syncLocalToCloudLambda();
    await provideNewApiOrIntegrations();
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    await revertToPriorState();
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud. Reverted to previous local state`);
  }
};
