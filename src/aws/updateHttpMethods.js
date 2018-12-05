const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const deleteApiGatewayIntegration = require('./deleteApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const { unique } = require('../util/fileUtils');

module.exports = async function updateHttpMethods(resource, lambdaName, restApiId, addMethods, removeMethods, path) {
  const resourceId = resource.id;
  let existingMethods = Object.keys(resource.resourceMethods || {});

  // add specified methods to API Gateway
  const addHttpMethodIntegrations = async () => {
    for (let i = 0; i < addMethods.length; i += 1) {
      const httpMethod = addMethods[i];
      if (!existingMethods.includes(httpMethod)) {
        const params = [httpMethod, resourceId, restApiId, lambdaName, path];
        await bamBam(createApiGatewayIntegration, { params, retryError: 'TooManyRequestsException' });
      }
    }
  };

  // remove specified methods except for GET
  const removeHttpMethodIntegrations = async () => {
    for (let i = 0; i < removeMethods.length; i += 1) {
      const httpMethod = removeMethods[i];
      if (existingMethods.includes(httpMethod)) {
        const params = [httpMethod, resourceId, restApiId];
        await bamBam(deleteApiGatewayIntegration, { params, retryError: 'TooManyRequestsException' });
      }
    }
  };

  await addHttpMethodIntegrations();
  // update existing methods to include newly added methods
  existingMethods = unique(existingMethods.concat(addMethods));
  await removeHttpMethodIntegrations();
};
