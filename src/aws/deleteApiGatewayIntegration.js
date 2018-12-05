const { asyncDeleteMethod } = require('./awsFunctions');

module.exports = async function deleteApiGatewayIntegration(httpMethod, resourceId, restApiId) {
  const deleteParams = {
    httpMethod,
    resourceId,
    restApiId,
  };

  await asyncDeleteMethod(deleteParams);
};
