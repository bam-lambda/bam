const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi.js');
const { doesApiExist } = require('../aws/doesResourceExist');
const getLambda = require('../aws/getLambda');
const updateHttpMethods = require('../aws/updateHttpMethods');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');

const {
  asyncCreateDeployment,
  asyncGetResources,
} = require('../aws/awsFunctions');

const {
  validateApiMethods,
  validateLambdaReDeployment,
} = require('../util/validations');

const {
  writeLambda,
  readApisLibrary,
  distinctElements,
  deleteStagingDirForLambda,
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
    ? distinctElements(options.methods.map(method => method.toUpperCase())) : [];
  const removeMethods = options.rmMethods
    ? distinctElements(options.rmMethods.map(method => method.toUpperCase())) : [];
  const invalidHttp = validateApiMethods(addMethods) || validateApiMethods(removeMethods);

  if (invalidHttp) {
    bamWarn(invalidHttp);
    return;
  }

  const syncLocalToCloudLambda = async () => {
    const { Configuration } = await getLambda(lambdaName);
    await writeLambda(Configuration, path);
  };

  const getApiId = async () => {
    const region = await asyncGetRegion();
    const apis = await readApisLibrary(path);
    return apis[region] && apis[region][lambdaName] && apis[region][lambdaName].restApiId;
  };

  const provideNewApiOrIntegrations = async () => {
    const restApiId = await getApiId();
    const apiExists = await doesApiExist(restApiId);

    if (!restApiId || !apiExists) {
      await deployApi(lambdaName, path, addMethods, stageName);
    } else {
      const resources = (await asyncGetResources({ restApiId })).items;
      const resource = resources.find(res => res.path === '/');
      await updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path);
      await bamBam(asyncCreateDeployment, {
        asyncFuncParams: [{ restApiId, stageName }],
        retryError: 'TooManyRequestsException',
      });
    }
  };

  // redeploy sequence
  const data = await updateLambda(lambdaName, path, options);

  if (data) {
    await syncLocalToCloudLambda();
    await provideNewApiOrIntegrations();

    await deleteStagingDirForLambda(lambdaName, path);
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud`);
  }
};
