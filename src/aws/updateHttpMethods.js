const uuid = require('uuid');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');
const { asyncGetRegion } = require('../util/getRegion');
const { readApisLibrary } = require('../util/fileUtils');

module.exports = async function updateHttpMethods({
  rootResource,
  greedyResource,
  lambdaName,
  restApiId,
  addMethods,
  removeMethods,
  path,
}) {
  const rootResourceId = rootResource.id;
  const rootExistingMethods = Object.keys(rootResource.resourceMethods || {});
  const greedyPathResourceId = greedyResource.id;
  const greedyPathExistingMethods = Object.keys(greedyResource.resourceMethods || {});
  const rootPath = '/';
  const greedyPath = '/*';
  const methodPermissionIds = {};

  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < addMethods.length; i += 1) {
      const httpMethod = addMethods[i];
      const rootPermissionId = uuid.v4();
      const greedyPermissionId = uuid.v4();
      methodPermissionIds[httpMethod] = {
        rootPermissionId,
        greedyPermissionId,
      };

      if (!rootExistingMethods.includes(httpMethod)) {
        const rootIntegrationParams = {
          httpMethod,
          restApiId,
          lambdaName,
          path,
          resourceId: rootResourceId,
          statementId: rootPermissionId,
          apiPath: rootPath,
        };
        await createApiGatewayIntegration(rootIntegrationParams);
        rootExistingMethods.push(httpMethod);
      }

      const greedyIntegrationParams = {
        httpMethod,
        restApiId,
        lambdaName,
        path,
        resourceId: greedyPathResourceId,
        statementId: greedyPermissionId,
        apiPath: greedyPath,
      };

      if (!greedyPathExistingMethods.includes(httpMethod)) {
        await createApiGatewayIntegration(greedyIntegrationParams);
        greedyPathExistingMethods.push(httpMethod);
      }
    }
  };

  const removeHttpMethodIntegrations = async () => {
    const region = await asyncGetRegion();
    const apis = await readApisLibrary(path);
    const regionalApi = apis[region][lambdaName];
    const existingMethodPermissionIds = regionalApi.methodPermissionIds;

    for (let i = 0; i < removeMethods.length; i += 1) {
      const httpMethod = removeMethods[i];
      let rootStatementId;
      let greedyStatementId;

      if (Object.keys(methodPermissionIds).includes(httpMethod)) {
        rootStatementId = methodPermissionIds[httpMethod].rootPermissionId;
        greedyStatementId = methodPermissionIds[httpMethod].greedyPermissionId;
        delete methodPermissionIds[httpMethod];
      }

      if (Object.keys(existingMethodPermissionIds).includes(httpMethod)) {
        rootStatementId = existingMethodPermissionIds[httpMethod].rootPermissionId;
        greedyStatementId = existingMethodPermissionIds[httpMethod].greedyPermissionId;
      }

      if (rootStatementId) {
        await deleteApiGatewayIntegration(lambdaName, httpMethod, rootResourceId, restApiId, rootStatementId);
      }

      if (greedyStatementId) {
        await deleteApiGatewayIntegration(lambdaName, httpMethod, greedyPathResourceId, restApiId, greedyStatementId);
      }
    }
  };

  await addHttpMethodIntegrations();
  await removeHttpMethodIntegrations();
  return methodPermissionIds;
};
