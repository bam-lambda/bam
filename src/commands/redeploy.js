const updateLambda = require('../aws/updateLambda');
const deployApi = require('../aws/deployApi');
const { doesApiExist } = require('../aws/doesResourceExist');
const updateHttpMethods = require('../aws/updateHttpMethods');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');
const getOption = require('../util/getOption');
const checkForOptionType = require('../util/checkForOptionType');

const {
  asyncCreateDeployment,
  asyncGetResources,
} = require('../aws/awsFunctions');

const {
  validateApiMethods,
  validateLambdaReDeployment,
  validateRoleAssumption,
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
} = require('../util/logger');

const stageName = 'bam';
const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

module.exports = async function redeploy(lambdaName, path, options) {
  const region = await asyncGetRegion();

  const getApiId = async () => {
    const apis = await readApisLibrary(path);
    return apis[region] && apis[region][lambdaName] && apis[region][lambdaName].restApiId;
  };

  // validations
  const invalidLambdaMsg = await validateLambdaReDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const roleOption = getOption(options, 'role');
  const permitDb = checkForOptionType(options, 'permitDb');
  const revokeDb = checkForOptionType(options, 'revokeDb');

  const userRole = options[roleOption] && options[roleOption][0];
  let roleName;

  if (revokeDb) roleName = '';
  if (permitDb) roleName = dbRole;
  if (userRole) {
    const invalidRoleMsg = await validateRoleAssumption(userRole);
    if (invalidRoleMsg) {
      bamWarn(invalidRoleMsg);
      return;
    }
    roleName = userRole;
  }

  const methodOption = getOption(options, 'method');
  let addMethods = options[methodOption];

  const removeOption = getOption(options, 'rmmethod');
  let removeMethods = options[removeOption];

  addMethods = addMethods
    ? distinctElements(addMethods.map(m => m.toUpperCase())) : [];

  removeMethods = removeMethods
    ? distinctElements(removeMethods.map(m => m.toUpperCase())) : [];

  const restApiId = await getApiId();
  const resources = (await asyncGetResources({ restApiId })).items;
  const resource = resources.find(res => res.path === '/');
  const existingMethods = Object.keys(resource.resourceMethods || {});

  const invalidHttp = await validateApiMethods(addMethods, removeMethods, existingMethods);

  if (invalidHttp) {
    bamWarn(invalidHttp);
    return;
  }

  const deployIntegrations = async () => {
    const rootResource = resources.find(res => res.path === '/');
    const greedyPathResource = resources.find(res => res.path === '/{proxy+}');
    const rootPath = '/';
    const greedyPath = '/*';

    await updateHttpMethods(rootResource, lambdaName, restApiId, addMethods, removeMethods, rootPath, path);
    await updateHttpMethods(greedyPathResource, lambdaName, restApiId, addMethods, removeMethods, greedyPath, path);
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });
  };

  const updateApiGateway = async () => {
    const apiExistsInLocalLibrary = !!restApiId;
    const apiExistsOnAws = await doesApiExist(restApiId);
    let apiData;

    if (!apiExistsInLocalLibrary || !apiExistsOnAws) {
      apiData = await deployApi(lambdaName, path, addMethods, stageName);
    } else {
      await deployIntegrations();
    }

    return apiData;
  };

  const updateLocalLibraries = async (updatedApiData) => {
    if (updatedApiData) {
      const { updatedRestApiId, updatedEndpoint } = updatedApiData;
      await writeApi(updatedEndpoint, addMethods, lambdaName, updatedRestApiId, path);
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
  const lambdaUpdateSuccess = await updateLambda(lambdaName, path, roleName);

  if (lambdaUpdateSuccess) {
    const apiData = await updateApiGateway();
    await updateLocalLibraries(apiData);
    await deleteStagingDirForLambda(lambdaName, path);
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    bamWarn(`Lambda "${lambdaName}" could not be updated in the cloud`);
  }
};
