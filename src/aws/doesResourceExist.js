const {
  asyncListRolePolicies,
  asyncGetRole,
  asyncGetFunction,
  asyncDescribeTable,
  asyncGetRestApi,
  asyncListAttachedRolePolicies,
  asyncGetPolicy,
} = require('./awsFunctions');

const doesRoleExist = async (role) => {
  try {
    await asyncGetRole({ RoleName: role });
    return true;
  } catch (err) {
    return false;
  }
};

const doesPolicyExist = async (policyArn) => {
  try {
    const result = await asyncGetPolicy({ PolicyArn: policyArn });
    return true;
  } catch (err) {
    return false;
  }
};

const doesLambdaExist = async (lambdaName) => {
  try {
    await asyncGetFunction({ FunctionName: lambdaName });
    return true;
  } catch (err) {
    return false;
  }
};

const doesTableExist = async (tableName) => {
  try {
    await asyncDescribeTable({ TableName: tableName });
    return true;
  } catch (err) {
    return false;
  }
};

const doesApiExist = async (restApiId) => {
  try {
    await asyncGetRestApi({ restApiId });
    return true;
  } catch (err) {
    return false;
  }
};

const isPolicyAttached = async (roleName, policyArn) => {
  try {
    const data = await asyncListAttachedRolePolicies({ RoleName: roleName });
    const attachedPolicies = data.AttachedPolicies;
    return attachedPolicies.any(obj => obj.PolicyArn === policyArn);
  } catch (err) {
    return false;
  }
};

module.exports = {
  doesRoleExist,
  doesPolicyExist,
  doesLambdaExist,
  doesTableExist,
  doesApiExist,
  isPolicyAttached,
};
