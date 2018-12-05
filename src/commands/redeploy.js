const {
  asyncCreateDeployment,
  asyncGetResources,
} = require('../aws/awsFunctions');

const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi.js');
const { doesApiExist } = require('../aws/doesResourceExist');
const getLambda = require('../aws/getLambda');
const {
  validateApiMethods,
  validateLambdaReDeployment,
} = require('../util/validations');
const updateHttpMethods = require('../aws/updateHttpMethods');
const bamBam = require('../util/bamBam');
const {
  writeLambda,
  promisifiedRimraf,
  exists,
  rename,
  readFuncLibrary,
  unique,
} = require('../util/fileUtils');
const {
  bamLog,
  bamWarn,
  bamError,
} = require('../util/logger');

const stageName = 'bam';

module.exports = async function redeploy(lambdaName, path, options) {
  // validations
  const invalidLambdaMsg = await validateLambdaReDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }
  const addMethods = options.methods
    ? unique(options.methods.map(method => method.toUpperCase())) : [];
  const removeMethods = options.rmMethods
    ? unique(options.rmMethods.map(method => method.toUpperCase())) : [];
  const invalidHttp = validateApiMethods(addMethods) || validateApiMethods(removeMethods);

  if (invalidHttp) {
    bamWarn(invalidHttp);
    return;
  }

  // helper methods
  const existsLocally = await exists(`${path}/.bam/functions/${lambdaName}`);

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
      await deployApi(lambdaName, path, addMethods, stageName);
    } else {
      const resources = (await asyncGetResources({ restApiId })).items;
      const resource = resources.find(res => res.path === '/');
      await updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path);
      await bamBam(asyncCreateDeployment, { params: [{ restApiId, stageName }], retryError: 'TooManyRequestsException' });
    }
  };

  const revertToPriorState = async () => {
    await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}-temp`);
  };

  // redeploy sequence
  const data = await updateLambda(lambdaName, path, options);

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
