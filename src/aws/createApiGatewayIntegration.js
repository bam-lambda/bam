const bamBam = require('../util/bamBam');
const { readConfig } = require('../util/fileUtils');
const { asyncGetRegion } = require('../util/getRegion');

const {
  asyncAddPermission,
  asyncPutMethod,
  asyncPutIntegration,
  asyncPutMethodResponse,
} = require('./awsFunctions');

module.exports = async function createApiGatewayIntegration({
  httpMethod,
  resourceId,
  restApiId,
  statementId,
  lambdaName,
  apiPath,
  path,
}) {
  const config = await readConfig(path);
  const region = await asyncGetRegion();
  const { accountNumber } = config;

  // add permission to lambda
  const sourceArn = `arn:aws:execute-api:${region}:${accountNumber}:${restApiId}/*/${httpMethod}${apiPath}`;
  const addPermissionParams = {
    FunctionName: lambdaName,
    StatementId: statementId,
    Principal: 'apigateway.amazonaws.com',
    Action: 'lambda:InvokeFunction',
    SourceArn: sourceArn,
  };
  await bamBam(asyncAddPermission, { asyncFuncParams: [addPermissionParams] });

  // put method
  const putMethodParams = {
    restApiId,
    resourceId,
    httpMethod,
    authorizationType: 'NONE',
  };
  await asyncPutMethod(putMethodParams);

  // put integration
  const putIntegrationParams = {
    restApiId,
    resourceId,
    httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountNumber}:function:${lambdaName}/invocations`,
  };
  await asyncPutIntegration(putIntegrationParams);

  // put method response
  const putMethodResponseParams = {
    httpMethod,
    resourceId,
    restApiId,
    statusCode: '200',
  };
  await asyncPutMethodResponse(putMethodResponseParams);
};
