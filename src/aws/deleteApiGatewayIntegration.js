const { asyncDeleteMethod, asyncRemovePermission } = require('./awsFunctions');

module.exports = async function deleteApiGatewayIntegration(lambdaName, httpMethod, resourceId, restApiId, statementId) {
  const deleteParams = {
    httpMethod,
    resourceId,
    restApiId,
  };

  await asyncRemovePermission({ FunctionName: lambdaName, StatementId: statementId });
  await asyncDeleteMethod(deleteParams);
};
