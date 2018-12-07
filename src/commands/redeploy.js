const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi.js');
const { doesApiExist } = require('../aws/doesResourceExist');
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
  writeApi,
  writeApisLibrary,
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

  const region = await asyncGetRegion();

  const getApiId = async () => {
    const apis = await readApisLibrary(path);
    return apis[region] && apis[region][lambdaName] && apis[region][lambdaName].restApiId;
  };

  const deployIntegrations = async (restApiId) => {
    const resources = (await asyncGetResources({ restApiId })).items;
    const resource = resources.find(res => res.path === '/');
    await updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path);
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });
  };

  const updateApiGateway = async () => {
    const restApiId = await getApiId();
    const apiExistsInLocalLibrary = !!restApiId;
    const apiExistsOnAws = await doesApiExist(restApiId);
    let apiData;

    if (!apiExistsInLocalLibrary || !apiExistsOnAws) {
      apiData = await deployApi(lambdaName, path, addMethods, stageName);
    } else {
      await deployIntegrations(restApiId);
    }

    return apiData;
  };

  const updateLocalLibraries = async (newApiData) => {
    if (newApiData) {
      const { restApiId, endpoint } = newApiData;
      await writeApi(endpoint, addMethods, lambdaName, restApiId, path);
    } else {
      const apis = await readApisLibrary(path);
      const regionalApis = apis[region];
      const api = regionalApis[lambdaName];
      const existingApis = api.methods;
      api.methods = existingApis.concat(addMethods)
        .filter(method => !removeMethods.includes(method));
      await writeApisLibrary(path, apis);
    }
  };

  // redeploy sequence
  const lambdaUpdateSuccess = await updateLambda(lambdaName, path, options);

  if (lambdaUpdateSuccess) {
    const apiData = await updateApiGateway();
    await updateLocalLibraries(apiData);
    await deleteStagingDirForLambda(lambdaName, path);
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud`);
  }
};
