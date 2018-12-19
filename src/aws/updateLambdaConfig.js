const { asyncLambdaUpdateFunctionConfiguration } = require('./awsFunctions');
const getLambda = require('./getLambda');
const { bamError } = require('../util/logger');
const { asyncGetRegion } = require('../util/getRegion');
const getDescription = require('../util/getDescription');

const {
  readConfig,
  readLambdasLibrary,
  writeLambda,
} = require('../util/fileUtils');

const getRole = async (lambdaName) => {
  let role;

  try {
    const data = await getLambda(lambdaName);
    role = data.Configuration.Role;
  } catch (err) {
    bamError(err);
  }

  return role;
};

module.exports = async function updateLambdaConfig(lambdaName, path, roleName) {
  const config = await readConfig(path);
  const { accountNumber } = config;
  const region = await asyncGetRegion();
  const description = await getDescription(lambdaName, path);

  const lambdas = await readLambdasLibrary(path);
  const lambda = lambdas[region][lambdaName];

  let currentDescription;
  if (lambda) currentDescription = lambda.description;
  const descriptionIsBeingUpdated = currentDescription !== description;

  let updatedRoleArn;
  if (roleName) {
    updatedRoleArn = `arn:aws:iam::${accountNumber}:role/${roleName}`;
  }

  const currentRoleArn = await getRole(lambdaName);
  const roleIsBeingUpdated = updatedRoleArn && currentRoleArn !== updatedRoleArn;
  if (roleIsBeingUpdated || descriptionIsBeingUpdated) {
    const configParams = {
      FunctionName: lambdaName,
      Description: description,
    };

    if (roleIsBeingUpdated) configParams.Role = updatedRoleArn;

    const lambdaData = await asyncLambdaUpdateFunctionConfiguration(configParams);
    if (descriptionIsBeingUpdated) await writeLambda(lambdaData, path);
  }
};
