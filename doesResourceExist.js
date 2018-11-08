const AWS = require('aws-sdk');
const { promisify } = require('util');
const iam = new AWS.IAM();

const doesRoleExist = async (role) => {
  const asyncGetRole = promisify(iam.getRole.bind(iam));

  try {
    await asyncGetRole({ RoleName: role });
    console.log(`${role} exists`);
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
    console.log(err, err.stack);
    return false;
  }
};

module.exports = {
  doesRoleExist,
  doesPolicyExist
};
