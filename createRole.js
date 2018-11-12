const AWS = require('aws-sdk');
const { promisify } = require('util');
const fs = require('fs');
const { doesRoleExist } = require('./doesResourceExist.js');

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

module.exports = async (defaultRole, src) => {
  const roleParams = {
    RoleName: defaultRole,
    AssumeRolePolicyDocument: JSON.stringify(rolePolicy),
  };
  const config = JSON.parse(fs.readFileSync(`${src}/bam/config.json`, 'utf8'));

  if (config.role === defaultRole && !(await doesRoleExist(defaultRole))) {
    try {
      const roleData = await asyncCreateRole(roleParams);
      const attachedParams = getAttachParams(roleData.Role.RoleName);
      await asyncAttachPolicy(attachedParams);
      console.log('success: role created with policy');
    } catch (err) {
      console.log(err, err.stack);
    }
  }
};
