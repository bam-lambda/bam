const { asyncLambdaUpdateFunctionConfiguration } = require('./awsFunctions');
const getLambda = require('./getLambda');
const { readConfig } = require('../util/fileUtils');
const { bamError } = require('../util/logger');

const getRole = async (lambdaName) => {
  try {
    const data = await getLambda(lambdaName);
    return data.Configuration.Role;
  } catch (err) {
    bamError(err);
  }
};

module.exports = async function updateLambdaConfig(lambdaName, path, roleName) {
  const config = await readConfig(path);
  const { accountNumber } = config;

  let updatedRoleArn;
  if (roleName) {
    updatedRoleArn = `arn:aws:iam::${accountNumber}:role/${roleName}`;
  }

  const currentRoleArn = await getRole(lambdaName);
  if (updatedRoleArn && currentRoleArn !== updatedRoleArn) {
    const configParams = {
      FunctionName: lambdaName,
      Role: updatedRoleArn,
    };

    await asyncLambdaUpdateFunctionConfiguration(configParams);
  }
};
