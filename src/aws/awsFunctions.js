const { promisify } = require('util');
const AWS = require('aws-sdk');

const getRegion = require('../util/getRegion');

const apiVersion = 'latest';

let asyncAddPermission;
let asyncPutMethod;
let asyncPutIntegration;
let asyncPutMethodResponse;
let asyncCreateTable;
let asyncCreatePolicy;
let asyncCreateRole;
let asyncAttachPolicy;
let asyncDetachPolicy;
let asyncDeleteRole;
let asyncDeletePolicy;
let asyncDeleteRestApi;
let asyncDeleteMethod;
let asyncDeleteTable;
let asyncLambdaDeleteFunction;
let asyncCreateApi;
let asyncGetResources;
let asyncCreateDeployment;
let asyncLambdaCreateFunction;
let asyncListRolePolicies;
let asyncGetRole;
let asyncGetFunction;
let asyncDescribeTable;
let asyncGetRestApi;
let asyncListAttachedRolePolicies;
let asyncLambdaUpdateFunctionCode;
let asyncLambdaUpdateFunctionConfiguration;
let asyncListFunctions;
let asyncListTables;

// const lambdaMethods = {};

// (async () => {
  // const region = await getRegion();
// console.log(region);
  const region = getRegion();
  const lambda = new AWS.Lambda({ apiVersion, region });
  const api = new AWS.APIGateway({ apiVersion, region });
  const dynamo = new AWS.DynamoDB({ apiVersion, region });
  const iam = new AWS.IAM();

  // lambda
  asyncAddPermission = promisify(lambda.addPermission.bind(lambda));
  asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda));
  asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));
  asyncGetFunction = promisify(lambda.getFunction.bind(lambda));
  asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));
  asyncLambdaUpdateFunctionConfiguration = promisify(lambda.updateFunctionConfiguration.bind(lambda));
  asyncListFunctions = promisify(lambda.listFunctions.bind(lambda));

  // api
  asyncPutMethod = promisify(api.putMethod.bind(api));
  asyncPutIntegration = promisify(api.putIntegration.bind(api));
  asyncPutMethodResponse = promisify(api.putMethodResponse.bind(api));
  asyncDeleteRestApi = promisify(api.deleteRestApi.bind(api));
  asyncDeleteMethod = promisify(api.deleteMethod.bind(api));
  asyncCreateApi = promisify(api.createRestApi.bind(api));
  asyncGetResources = promisify(api.getResources.bind(api));
  asyncCreateDeployment = promisify(api.createDeployment.bind(api));
  asyncGetRestApi = promisify(api.getRestApi.bind(api));

  // dynamo
  asyncCreateTable = promisify(dynamo.createTable.bind(dynamo));
  asyncDeleteTable = promisify(dynamo.deleteTable.bind(dynamo));
  asyncDescribeTable = promisify(dynamo.describeTable.bind(dynamo));
  asyncListTables = promisify(dynamo.listTables.bind(dynamo));

  // iam
  asyncCreateRole = promisify(iam.createRole.bind(iam));
  asyncCreatePolicy = promisify(iam.createPolicy.bind(iam));
  asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam));
  asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
  asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
  asyncDeletePolicy = promisify(iam.deletePolicy.bind(iam));
  asyncListRolePolicies = promisify(iam.listAttachedRolePolicies.bind(iam));
  asyncGetRole = promisify(iam.getRole.bind(iam));
  asyncListAttachedRolePolicies = promisify(iam.listAttachedRolePolicies.bind(iam));
// })();

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
