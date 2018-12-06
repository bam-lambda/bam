const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const { distinctElements } = require('../util/fileUtils');

module.exports = async function updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path) {
  const resourceId = resource.id;
  let existingMethods = Object.keys(resource.resourceMethods || {});

  // add specified methods to API Gateway
  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < addMethods.length; i += 1) {
      const httpMethod = addMethods[i];
      if (!existingMethods.includes(httpMethod)) {
        await createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, path);
      }
    }
  };

  // remove specified methods except for GET
  const removeHttpMethodIntegrations = async () => {
    for (let i = 0; i < removeMethods.length; i += 1) {
      const httpMethod = removeMethods[i];
      if (existingMethods.includes(httpMethod)) {
        await deleteApiGatewayIntegration(httpMethod, resourceId, restApiId, path);
      }
    }
  };

  await addHttpMethodIntegrations();
  // update existing methods to include newly added methods
  existingMethods = distinctElements(existingMethods.concat(addMethods));
  await removeHttpMethodIntegrations();
};
