const AWS = require('aws-sdk');
const { promisify } = require('util');
const { readConfig, readFile } = require('../util/fileUtils');
const { doesRoleExist, doesPolicyExist, isPolicyAttached } = require('./doesResourceExist');
const bamSpinner = require('../util/spinner');

const {
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

const getAttachParams = (roleName, policyArn) => (
  {
    RoleName: roleName,
    PolicyArn: policyArn,
  }
);

const getRoleParams = roleName => (
  {
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(rolePolicy),
  }
);

const asyncCreateRole = promisify(iam.createRole.bind(iam));
const asyncCreatePolicy = promisify(iam.createPolicy.bind(iam));
const asyncAttachPolicy = promisify(iam.attachRolePolicy.bind(iam));

const createRole = async (roleName) => {
  const roleParams = getRoleParams(roleName);
  const doesRoleNameExist = await doesRoleExist(roleName);
  if (!doesRoleNameExist) {
    await asyncCreateRole(roleParams);
    bamSpinner.stop();
    bamLog(`Role "${roleName}" has been created`);
  }
};

const createDatabaseBamRolePolicy = async (databaseBamRole, databasePolicyName) => {
  const doesDatabasePolicyExist = await doesPolicyExist(databaseBamRole, databasePolicyName);

  if (!doesDatabasePolicyExist) {
    const policyDocumentJSON = await readFile(`${__dirname}/../../templates/databaseBamRolePolicy.json`, 'utf8');
    const policyDocument = JSON.stringify(JSON.parse(policyDocumentJSON));

    const policyParams = {
      PolicyName: databasePolicyName,
      PolicyDocument: policyDocument,
    };

    await asyncCreatePolicy(policyParams);
  }
};

const attachPolicy = async (roleName, policyArn) => {
  const isAwsPolicyAttached = await isPolicyAttached(roleName, policyArn);
  if (!isAwsPolicyAttached) {
    const attachedParams = getAttachParams(roleName, policyArn);
    await asyncAttachPolicy(attachedParams);
  }
};

const createBamRole = async (roleName) => {
  bamSpinner.start();
  try {
    await createRole(roleName);
    await attachPolicy(roleName, AWSLambdaBasicExecutionRolePolicyARN);
    bamSpinner.stop();
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};

const createDatabaseBamRole = async (databaseBamRole, path) => {
  bamSpinner.start();

  const config = await readConfig(path);
  const { accountNumber } = config;
  const databasePolicyName = `${databaseBamRole}Policy`;
  const databasePolicyArn = `arn:aws:iam::${accountNumber}:policy/${databasePolicyName}`;

  try {
    await createRole(databaseBamRole);
    await createDatabaseBamRolePolicy(databaseBamRole, databasePolicyName);
    await attachPolicy(databaseBamRole, databasePolicyArn);
    bamSpinner.stop();
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};

module.exports = {
  createBamRole,
  createDatabaseBamRole,
};
