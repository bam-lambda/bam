const uuid = require('uuid');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');
const { asyncGetRegion } = require('../util/getRegion');
const { readApisLibrary } = require('../util/fileUtils');

module.exports = async function updateHttpMethods({
  rootResource,
  greedyResource,
  resourceName,
  restApiId,
  addMethods,
  removeMethods,
  path,
}) {
  const rootResourceId = rootResource.id;
  const rootExistingMethods = Object.keys(rootResource.resourceMethods || {});
  const rootPath = '/';

  const greedyPathResourceId = greedyResource.id;
  const greedyPathExistingMethods = Object.keys(
    greedyResource.resourceMethods || {},
  );
  const greedyPath = '/*';

  const methodPermissionIds = {};
  let filteredAddMethods;
  let filteredRemoveMethods;

  const removeMethodsBeingAddedAndRemovedAtSameTime = () => {
    filteredAddMethods = addMethods.filter(
      (method) => !removeMethods.includes(method),
    );
    filteredRemoveMethods = removeMethods.filter(
      (method) => !addMethods.includes(method),
    );
  };

  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < filteredAddMethods.length; i += 1) {
      const httpMethod = filteredAddMethods[i];
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
          resourceName,
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
        resourceName,
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
    const regionalApi = apis[region][resourceName];
    const existingMethodPermissionIds = regionalApi.methodPermissionIds;

    for (let i = 0; i < filteredRemoveMethods.length; i += 1) {
      const httpMethod = filteredRemoveMethods[i];
      let rootStatementId;
      let greedyStatementId;

      if (Object.keys(existingMethodPermissionIds).includes(httpMethod)) {
        rootStatementId =
          existingMethodPermissionIds[httpMethod].rootPermissionId;
        greedyStatementId =
          existingMethodPermissionIds[httpMethod].greedyPermissionId;

        await deleteApiGatewayIntegration(
          resourceName,
          httpMethod,
          rootResourceId,
          restApiId,
          rootStatementId,
        );

        await deleteApiGatewayIntegration(
          resourceName,
          httpMethod,
          greedyPathResourceId,
          restApiId,
          greedyStatementId,
        );
      }
    }
  };

  removeMethodsBeingAddedAndRemovedAtSameTime();
  await addHttpMethodIntegrations();
  await removeHttpMethodIntegrations();
  return methodPermissionIds;
};
