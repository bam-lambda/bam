const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');
const { distinctElements } = require('../util/fileUtils');
const { bamWarn } = require('../util/logger');

module.exports = async function updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path) {
  const resourceId = resource.id;
  let existingMethods = Object.keys(resource.resourceMethods || {});

  // add specified methods to API Gateway
  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < addMethods.length; i += 1) {
      const httpMethod = addMethods[i];
      if (!existingMethods.includes(httpMethod)) {
        await createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, path);
        existingMethods.push(httpMethod);
      }
    }
  };

  // remove specified methods except for GET
  const removeHttpMethodIntegrations = async () => {
    for (let i = 0; i < removeMethods.length; i += 1) {
      const httpMethod = removeMethods[i];
      if (existingMethods.includes(httpMethod)) {
        if (existingMethods.length > 1) {
          await deleteApiGatewayIntegration(httpMethod, resourceId, restApiId, path);
          existingMethods = existingMethods.filter(m => httpMethod !== m);
        } else {
          bamWarn(`Api ${lambdaName} must be left with at least 1 HTTP method.`);
          return;
        }
      }
    }
  };

  await addHttpMethodIntegrations();
  await removeHttpMethodIntegrations();
};
