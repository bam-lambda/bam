const { asyncDeleteMethod, asyncRemovePermission } = require('./awsFunctions');

module.exports = async function deleteApiGatewayIntegration(
  resourceName,
  httpMethod,
  resourceId,
  restApiId,
  statementId,
) {
  const deleteParams = {
    httpMethod,
    resourceId,
    restApiId,
  };

  await asyncRemovePermission({
    FunctionName: resourceName,
    StatementId: statementId,
  });
  await asyncDeleteMethod(deleteParams);
};
