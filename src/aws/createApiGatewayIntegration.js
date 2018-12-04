const AWS = require('aws-sdk');
const { promisify } = require('util');
const uuid = require('uuid');
const bamBam = require('../util/bamBam');
const { readConfig } = require('../util/fileUtils');

const apiVersion = 'latest';

module.exports = async function createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, path) { 
  const config = await readConfig(path);
  const { region, accountNumber } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const api = new AWS.APIGateway({ apiVersion, region });

  const asyncAddPermission = promisify(lambda.addPermission.bind(lambda));
  const asyncPutMethod = promisify(api.putMethod.bind(api));
  const asyncPutIntegration = promisify(api.putIntegration.bind(api));
  const asyncPutMethodResponse = promisify(api.putMethodResponse.bind(api));

  // add permission to lambda
  const sourceArn = `arn:aws:execute-api:${region}:${accountNumber}:${restApiId}/*/${httpMethod}/`;
  const addPermissionParams = {
    FunctionName: lambdaName,
    StatementId: uuid.v4(),
    Principal: 'apigateway.amazonaws.com',
    Action: 'lambda:InvokeFunction',
    SourceArn: sourceArn,
  };
  await bamBam(asyncAddPermission, { params: [addPermissionParams] });

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
