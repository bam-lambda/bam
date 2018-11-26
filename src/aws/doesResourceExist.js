const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('../util/getRegion');

const iam = new AWS.IAM();
const apiVersion = 'latest';

const doesRoleExist = async (role) => {
  const asyncGetRole = promisify(iam.getRole.bind(iam));

  try {
    await asyncGetRole({ RoleName: role });
    return true;
  } catch (err) {
    return false;
  }
};

const doesPolicyExist = async (roleName, policyName) => {
  const asyncListRolePolicies = promisify(iam.listAttachedRolePolicies.bind(iam));

  try {
    const result = await asyncListRolePolicies({ RoleName: roleName });
    return result.AttachedPolicies[0].PolicyName === policyName;
  } catch (err) {
    return false;
  }
};

const doesLambdaExist = async (lambdaName) => {
  const region = await getRegion();
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncGetFunction = promisify(lambda.getFunction.bind(lambda));

  try {
    await asyncGetFunction({ FunctionName: lambdaName });
    return true;
  } catch (err) {
    return false;
  }
};

const doesApiExist = async (restApiId) => {
  const region = await getRegion();
  const api = new AWS.APIGateway({ apiVersion, region });
  const asyncGetRestApi = promisify(api.getRestApi.bind(api));

  try {
    await asyncGetRestApi({ restApiId });
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  doesRoleExist,
  doesPolicyExist,
  doesLambdaExist,
  doesApiExist,
};
