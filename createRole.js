const AWS = require('aws-sdk');
const { promisify } = require('util');

const iam = new AWS.IAM();
const AWSLambdaBasicExecutionRolePolicyARN  = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

const promiseTryCatch = async (asyncFunc) => {
  let result;
  try {
    result = await asyncFunc();
  } catch (err) {
    return console.error(err);
  }
  return result;
};

const setRole = async () => {
  const rolePolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com'
        },
        Action: 'sts:AssumeRole'
      }
    ]
  };

  const roleParams = {
    RoleName: 'defaultBamRole',
    AssumeRolePolicyDocument: JSON.stringify(rolePolicy)
  };

  const asyncCreateRole = promisify(iam.createRole.bind(iam, roleParams)); // create role
  const roleData = await promiseTryCatch(asyncCreateRole);
  const roleName = roleData.Role.RoleName;

  const attachParams = {
    RoleName: roleName,
    PolicyArn: AWSLambdaBasicExecutionRolePolicyARN
  };

  const asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam, attachParams));
  const roleWithPolicy = await promiseTryCatch(asyncAttachPolicy, attachParams); // attach policy to role
};

module.exports = () => {
  const asyncSetRole = promisify(setRole);
  return promiseTryCatch(asyncSetRole);
};




