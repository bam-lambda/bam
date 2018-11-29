const AWS = require('aws-sdk');
const { promisify } = require('util');
const { readConfig, readFile } = require('../util/fileUtils');
const { doesRoleExist } = require('./doesResourceExist');
const {
  bamSpinner,
  bamLog,
  bamError,
} = require('../util/logger');

const iam = new AWS.IAM();
const AWSLambdaBasicExecutionRolePolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

const databaseBamRole = 'databaseBamRole';

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

const createBamRole = async (roleName) => {
  bamSpinner.start();

  try {
    const roleParams = getRoleParams(roleName);
    const roleData = await asyncCreateRole(roleParams);
    const attachedParams = getAttachParams(roleData.Role.RoleName,
      AWSLambdaBasicExecutionRolePolicyARN);
    await asyncAttachPolicy(attachedParams);
    bamSpinner.stop();
    bamLog(`Role "${roleName}" has been created`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};

const createDatabaseBamRole = async () => {
  bamSpinner.start();

  try {
    const databaseRoleParams = getRoleParams(databaseBamRole);
    await asyncCreateRole(databaseRoleParams);
    const policyDocumentJSON = await readFile(`${__dirname}/../../templates/databaseBamRolePolicy.json`, 'utf8');
    const policyDocument = JSON.stringify(JSON.parse(policyDocumentJSON));

    // TODO: bamBam, createRole test (delete roles afterEach & add test for databaseBamRole)
    const policyParams = {
      PolicyName: 'databaseBamPolicy',
      PolicyDocument: policyDocument,
    };
    const databasePolicyData = await asyncCreatePolicy(policyParams);
    const databasePolicyArn = databasePolicyData.Policy.Arn;
    const databaseAttachedParams = await getAttachParams(databaseBamRole, databasePolicyArn);

    await asyncAttachPolicy(databaseAttachedParams);
    bamSpinner.stop();
    bamLog(`Role "${databaseBamRole}" has been created`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};

module.exports = async function createRoles(bamRole, path) {
  const config = await readConfig(path);
  const roleExists = await doesRoleExist(bamRole);
  if (config.role === bamRole && !roleExists) {
    await createBamRole(bamRole, path);
  }

  const databaseBamRoleExists = await doesRoleExist(databaseBamRole);
  if (!databaseBamRoleExists) {
    await createDatabaseBamRole();
  }
};
