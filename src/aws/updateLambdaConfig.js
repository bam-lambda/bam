const AWS = require('aws-sdk');
const { promisify } = require('util');

const { readConfig } = require('../util/fileUtils');
const { bamWarn, bamError } = require('../util/logger');
const bamBam = require('../util/bamBam');
const { doesRoleExist } = require('./doesResourceExist');
const getLambda = require('./getLambda');

const apiVersion = 'latest';

const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

module.exports = async function updateLambdaConfig(lambdaName, path, options) {
  const config = await readConfig(path);
  const { region, accountNumber, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaUpdateFunctionConfiguration = promisify(lambda.updateFunctionConfiguration.bind(lambda));

  const databaseRoleArn = `arn:aws:iam::${accountNumber}:role/${dbRole}`;
  const defaultRoleArn = `arn:aws:iam::${accountNumber}:role/${role}`;

  let updatedRoleArn;
  if (options.role && options.role[0]) {
    const userRole = options.role[0];
    const roleExists = await doesRoleExist(userRole);
    if (!roleExists) {
      bamWarn(`Role ${userRole} does not exist`);
      return;
    }
    updatedRoleArn = `arn:aws:iam::${accountNumber}:role/${userRole}`;
  } else if (options.revokeDb) {
    updatedRoleArn = defaultRoleArn;
  } else if (options.permitDb) {
    updatedRoleArn = databaseRoleArn;
  }

  const getRole = async (lambdaName) => { 
    try {
      const data = await getLambda(lambdaName);
      return data.Configuration.Role;
    } catch (err) {
      bamError(err);
    }
  };

  const currentRoleArn = await getRole(lambdaName);
  if (updatedRoleArn && currentRoleArn !== updatedRoleArn) {
    const configParams = {
      FunctionName: lambdaName,
      Role: updatedRoleArn,
    };
    await bamBam(asyncLambdaUpdateFunctionConfiguration, { params: [configParams], retryError: 'TooManyRequestsException'});
  }
};
