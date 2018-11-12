const AWS = require('aws-sdk');
const { promisify } = require('util');

const iam = new AWS.IAM();
const AWSLambdaBasicExecutionRolePolicyARN  = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

// const promiseTryCatch = async (asyncFunc) => {
//   let result;
//   try {
//     result = await asyncFunc();
//   } catch (err) {
//     return console.error(err);
//   }
//   return result;
// };


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

const getAttachParams = (roleName) => {
  return {
    RoleName: roleName,
    PolicyArn: AWSLambdaBasicExecutionRolePolicyARN
  };
};

const asyncCreateRole = promisify(iam.createRole.bind(iam));
const asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam));

module.exports = async () => {
  try {
    const roleData = await asyncCreateRole(roleParams);
    const attachedParams = getAttachParams(roleData.Role.RoleName);
    await asyncAttachPolicy(attachedParams);
    console.log('success: role created with policy');
  } catch (err) {
    console.log(err, err.stack);
  }
};
