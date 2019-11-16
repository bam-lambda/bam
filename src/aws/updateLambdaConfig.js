const { asyncLambdaUpdateFunctionConfiguration } = require('./awsFunctions');
const getLambdaConfig = require('./getLambdaConfig');
const { bamError } = require('../util/logger');
const { asyncGetRegion } = require('../util/getRegion');
const getDescription = require('../util/getDescription');

const {
  readConfig,
  readLambdasLibrary,
  writeLambda,
} = require('../util/fileUtils');

module.exports = async function updateLambdaConfig(lambdaName, path, roleName, runtime) {
  const config = await readConfig(path);
  const { accountNumber } = config;
  const region = await asyncGetRegion();
  const description = await getDescription(lambdaName, path);
  const lambdaConfig = await getLambdaConfig(lambdaName);
  const currentRoleArn = lambdaConfig.Role;
  const currentRuntime = lambdaConfig.Runtime;

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
  const roleIsBeingUpdated =
    updatedRoleArn && currentRoleArn !== updatedRoleArn;

  const runtimeIsBeingUpdated = currentRuntime !== runtime;

  if (roleIsBeingUpdated || descriptionIsBeingUpdated || runtimeIsBeingUpdated) {
    const configParams = {
      FunctionName: lambdaName,
      Description: description,
    };

    if (roleIsBeingUpdated) configParams.Role = updatedRoleArn;
    if (runtimeIsBeingUpdated) configParams.Runtime = runtime;

    const lambdaData = await asyncLambdaUpdateFunctionConfiguration(
      configParams,
    );
    if (descriptionIsBeingUpdated) await writeLambda(lambdaData, path);
  }
};
