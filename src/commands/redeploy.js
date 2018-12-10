const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi');
const { doesApiExist } = require('../aws/doesResourceExist');
const updateHttpMethods = require('../aws/updateHttpMethods');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');

const {
  asyncCreateDeployment,
  asyncGetResources,
  asyncGetFunction,
} = require('../aws/awsFunctions');

const {
  validateApiMethods,
  validateLambdaReDeployment,
} = require('../util/validations');

const {
  readLambdasLibrary,
  writeLambda,
  writeApi,
  writeApisLibrary,
  readApisLibrary,
  distinctElements,
  deleteStagingDirForLambda,
} = require('../util/fileUtils');

const {
  bamLog,
  bamWarn,
} = require('../util/logger');

const stageName = 'bam';

module.exports = async function redeploy(lambdaName, path, options) {
  const region = await asyncGetRegion();
  const api = {
    restApiId: undefined,
    resources: [],
    addMethods: [],
    removeMethods: [],
    existingMethods: [],
  };

  const getApiId = async () => {
    const apis = await readApisLibrary(path);
    return apis[region] && apis[region][lambdaName] && apis[region][lambdaName].restApiId;
  };

  const getApiResources = async () => {
    const { restApiId } = api;
    const apiExistsOnAws = await doesApiExist(api.restApiId);
    if (restApiId && apiExistsOnAws) {
      api.resources = (await asyncGetResources({ restApiId })).items;
    }
  };

  const resolveHttpMethodsFromOptions = () => {
    let addMethods = options.methods || options.method;
    let removeMethods = options.rmMethods || options.rmMethod;
    let existingMethods = [];

    addMethods = addMethods
      ? distinctElements(addMethods.map(m => m.toUpperCase())) : [];

    removeMethods = removeMethods
      ? distinctElements(removeMethods.map(m => m.toUpperCase())) : [];

    if (api.resources.length > 0) {
      const resource = api.resources.find(res => res.path === '/');
      existingMethods = Object.keys(resource.resourceMethods || {});
    }

    if (existingMethods.length === 0 && addMethods.length === 0) {
      addMethods.push('GET');
    }


    api.addMethods = addMethods;
    api.removeMethods = removeMethods;
    api.existingMethods = existingMethods;
  };

  const deployIntegrations = async () => {
    const rootResource = api.resources.find(res => res.path === '/');
    const greedyPathResource = api.resources.find(res => res.path === '/{proxy+}');
    const rootPath = '/';
    const greedyPath = '/*';

    await updateHttpMethods(rootResource,
      lambdaName,
      api.restApiId,
      api.addMethods,
      api.removeMethods,
      rootPath,
      path);
    await updateHttpMethods(greedyPathResource,
      lambdaName,
      api.restApiId,
      api.addMethods,
      api.removeMethods,
      greedyPath,
      path);
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId: api.restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });
  };

  const updateApiGateway = async () => {
    const apiExistsInLocalLibrary = !!(api.restApiId);
    const apiExistsOnAws = await doesApiExist(api.restApiId);
    const userIsAddingMethods = !!(options.methods || options.method);
    const userIsAddingApi = !!(options.addApi);
    let data;

    if ((apiExistsInLocalLibrary || userIsAddingMethods || userIsAddingApi) && !apiExistsOnAws) {
      data = await deployApi(lambdaName, path, api.addMethods, stageName);
    } else if (userIsAddingMethods || api.removeMethods.length > 0) {
      await deployIntegrations(api.resources, api.existingMethods);
    }

    return data;
  };

  const updateLocalLibraries = async (updatedApiData) => {
    const apiExistsOnAws = await doesApiExist(api.restApiId);

    if (updatedApiData) {
      const { restApiId, endpoint } = updatedApiData;

      await writeApi(endpoint, api.addMethods, lambdaName, restApiId, path);
    } else if (apiExistsOnAws) {
      const apis = await readApisLibrary(path);
      const regionalApis = apis[region];
      const regionalApi = regionalApis[lambdaName];
      const existingApis = regionalApi.methods;
      regionalApi.methods = existingApis.concat(api.addMethods)
        .filter(method => !api.removeMethods.includes(method));
      await writeApisLibrary(path, apis);
    }
  };

  // validations
  const invalidLambdaMsg = await validateLambdaReDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  // redployment sequence starts here:
  api.restApiId = await getApiId();
  const resources = await getApiResources();
  if (resources) api.resources = resources;

  resolveHttpMethodsFromOptions();

  const invalidHttp = await validateApiMethods(api.addMethods,
    api.removeMethods,
    api.existingMethods);
  if (invalidHttp) {
    bamWarn(invalidHttp);
    return;
  }

  const localLambda = (await readLambdasLibrary(path))[region][lambdaName];
  if (!localLambda) {
    const lambdaData = (await asyncGetFunction({ FunctionName: lambdaName })).Configuration;
    writeLambda(lambdaData, path, lambdaData.Description);
  }

  const lambdaUpdateSuccess = await updateLambda(lambdaName, path, options);

  if (lambdaUpdateSuccess) {
    const apiData = await updateApiGateway();
    await updateLocalLibraries(apiData);
    await deleteStagingDirForLambda(lambdaName, path);
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    bamWarn(`Lambda "${lambdaName}" could not be updated in the cloud`);
  }
};
