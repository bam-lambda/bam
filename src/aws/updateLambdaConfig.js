const { asyncLambdaUpdateFunctionConfiguration } = require('./awsFunctions');

const { readConfig } = require('../util/fileUtils');
const { bamWarn, bamError } = require('../util/logger');
const bamSpinner = require('../util/spinner');
const checkForOptionType = require('../util/checkForOptionType');
const bamBam = require('../util/bamBam');
const { doesRoleExist } = require('./doesResourceExist');
const getLambda = require('./getLambda');

const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

const getRole = async (lambdaName) => {
  try {
    const data = await getLambda(lambdaName);
    return data.Configuration.Role;
  } catch (err) {
    bamError(err);
  }
};

module.exports = async function updateLambdaConfig(lambdaName, path, options) {
  const config = await readConfig(path);
  const { accountNumber, role } = config;
  const permitDb = checkForOptionType(options, 'permitDb');
  const revokeDb = checkForOptionType(options, 'revokeDb');

  const databaseRoleArn = `arn:aws:iam::${accountNumber}:role/${dbRole}`;
  const defaultRoleArn = `arn:aws:iam::${accountNumber}:role/${role}`;

  let updatedRoleArn;
  if (options.role && options.role[0]) {
    const userRole = options.role[0];
    const roleExists = await doesRoleExist(userRole);
    if (!roleExists) {
      bamSpinner.stop();
      bamWarn(`Role "${userRole}" does not exist`);
      bamSpinner.start();
      return;
    }
    updatedRoleArn = `arn:aws:iam::${accountNumber}:role/${userRole}`;
  } else if (revokeDb) {
    updatedRoleArn = defaultRoleArn;
  } else if (permitDb) {
    updatedRoleArn = databaseRoleArn;
  }

  const currentRoleArn = await getRole(lambdaName);
  if (updatedRoleArn && currentRoleArn !== updatedRoleArn) {
    const configParams = {
      FunctionName: lambdaName,
      Role: updatedRoleArn,
    };

    await bamBam(asyncLambdaUpdateFunctionConfiguration, {
      params: [configParams], retryError: 'TooManyRequestsException',
    });
  }
};
