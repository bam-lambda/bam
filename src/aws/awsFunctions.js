const { promisify } = require('util');
const AWS = require('aws-sdk');

const { getRegion } = require('../util/getRegion');

const apiVersion = 'latest';
const region = getRegion();
const lambda = new AWS.Lambda({ apiVersion, region });
const api = new AWS.APIGateway({ apiVersion, region });
const dynamo = new AWS.DynamoDB({ apiVersion, region });
const iam = new AWS.IAM();

// lambda
const asyncAddPermission = promisify(lambda.addPermission.bind(lambda));
const asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda));
const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));
const asyncGetFunction = promisify(lambda.getFunction.bind(lambda));
const asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));
const asyncLambdaUpdateFunctionConfiguration = promisify(lambda.updateFunctionConfiguration.bind(lambda));
const asyncListFunctions = promisify(lambda.listFunctions.bind(lambda));

// api
const asyncPutMethod = promisify(api.putMethod.bind(api));
const asyncPutIntegration = promisify(api.putIntegration.bind(api));
const asyncPutMethodResponse = promisify(api.putMethodResponse.bind(api));
const asyncDeleteRestApi = promisify(api.deleteRestApi.bind(api));
const asyncDeleteMethod = promisify(api.deleteMethod.bind(api));
const asyncCreateApi = promisify(api.createRestApi.bind(api));
const asyncGetResources = promisify(api.getResources.bind(api));
const asyncCreateDeployment = promisify(api.createDeployment.bind(api));
const asyncGetRestApi = promisify(api.getRestApi.bind(api));

// dynamo
const asyncCreateTable = promisify(dynamo.createTable.bind(dynamo));
const asyncDeleteTable = promisify(dynamo.deleteTable.bind(dynamo));
const asyncDescribeTable = promisify(dynamo.describeTable.bind(dynamo));
const asyncListTables = promisify(dynamo.listTables.bind(dynamo));

// iam
const asyncCreateRole = promisify(iam.createRole.bind(iam));
const asyncCreatePolicy = promisify(iam.createPolicy.bind(iam));
const asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam));
const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const asyncDeletePolicy = promisify(iam.deletePolicy.bind(iam));
const asyncListRolePolicies = promisify(iam.listAttachedRolePolicies.bind(iam));
const asyncGetRole = promisify(iam.getRole.bind(iam));
const asyncListAttachedRolePolicies = promisify(iam.listAttachedRolePolicies.bind(iam));

module.exports = {
  asyncAddPermission,
  asyncPutMethod,
  asyncPutIntegration,
  asyncPutMethodResponse,
  asyncCreateTable,
  asyncCreatePolicy,
  asyncCreateRole,
  asyncAttachPolicy,
  asyncDetachPolicy,
  asyncDeletePolicy,
  asyncDeleteRole,
  asyncDeleteRestApi,
  asyncDeleteMethod,
  asyncDeleteTable,
  asyncLambdaDeleteFunction,
  asyncCreateApi,
  asyncGetResources,
  asyncCreateDeployment,
  asyncLambdaCreateFunction,
  asyncListRolePolicies,
  asyncGetRole,
  asyncGetFunction,
  asyncDescribeTable,
  asyncGetRestApi,
  asyncListAttachedRolePolicies,
  asyncLambdaUpdateFunctionCode,
  asyncLambdaUpdateFunctionConfiguration,
  asyncListFunctions,
  asyncListTables,
};
