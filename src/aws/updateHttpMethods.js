const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');

module.exports = async function updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, apiPath, path) {
  const resourceId = resource.id;
  const existingMethods = Object.keys(resource.resourceMethods || {});

  // add specified methods to API Gateway
  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < addMethods.length; i += 1) {
      const httpMethod = addMethods[i];
      if (!existingMethods.includes(httpMethod)) {
        await createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, apiPath, path);
        existingMethods.push(httpMethod);
      }
    }
  };

  // remove specified methods except for GET
  const removeHttpMethodIntegrations = async () => {
    for (let i = 0; i < removeMethods.length; i += 1) {
      const httpMethod = removeMethods[i];
      if (existingMethods.includes(httpMethod)) {
        await deleteApiGatewayIntegration(httpMethod, resourceId, restApiId);
      }
    }
  };

  await addHttpMethodIntegrations();
  await removeHttpMethodIntegrations();
};
