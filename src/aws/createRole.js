const AWS = require('aws-sdk');
const { promisify } = require('util');
const { readConfig } = require('../util/fileUtils');
const { doesRoleExist } = require('./doesResourceExist');
const {
  bamSpinner,
  bamLog,
  bamError,
} = require('../util/logger');

const iam = new AWS.IAM();
const AWSLambdaBasicExecutionRolePolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

const rolePolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: {
        Service: 'lambda.amazonaws.com',
      },
      Action: 'sts:AssumeRole',
    },
  ],
};

const getAttachParams = roleName => (
  {
    RoleName: roleName,
    PolicyArn: AWSLambdaBasicExecutionRolePolicyARN,
  }
);

const asyncCreateRole = promisify(iam.createRole.bind(iam));
const asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam));

module.exports = async function createRole(defaultRole, path) {
  const roleParams = {
    RoleName: defaultRole,
    AssumeRolePolicyDocument: JSON.stringify(rolePolicy),
  };
  const config = await readConfig(path);

  if (config.role === defaultRole && !(await doesRoleExist(defaultRole))) {
    bamSpinner.start();
    try {
      const roleData = await asyncCreateRole(roleParams);
      const attachedParams = getAttachParams(roleData.Role.RoleName);
      await asyncAttachPolicy(attachedParams);
      bamSpinner.stop();
      bamLog(`Role "${defaultRole}" has been created`);
    } catch (err) {
      bamSpinner.stop();
      bamError(err, err.stack);
    }
  }
};
