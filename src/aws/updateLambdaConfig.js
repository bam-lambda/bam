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

const getConfig = async (lambdaName) => {
  let role, runtime;

  try {
    const data = await getLambda(lambdaName);
    role = data.Configuration.Role;
    runtime = data.Configuration.Runtime;
  } catch (err) {
    bamError(err);
  }

  return [role, runtime];
};

module.exports = async function updateLambdaConfig(lambdaName, path, roleName, runtime) {
  const config = await readConfig(path);
  const { accountNumber } = config;
  const region = await asyncGetRegion();
  const description = await getDescription(lambdaName, path);
  const [ currentRoleArn, currentRuntime ] = await getConfig(lambdaName);

  const lambdas = await readLambdasLibrary(path);
  const lambda = lambdas[region][lambdaName];

  let currentDescription;
  if (lambda) currentDescription = lambda.description;
  const descriptionIsBeingUpdated = currentDescription !== description;

  let updatedRoleArn;
  if (roleName) updatedRoleArn = `arn:aws:iam::${accountNumber}:role/${roleName}`;
  const roleIsBeingUpdated = updatedRoleArn && currentRoleArn !== updatedRoleArn;

  const runtimeIsBeingUpdated = currentRuntime !== runtime;

  if (roleIsBeingUpdated || descriptionIsBeingUpdated || runtimeIsBeingUpdated) {
    const configParams = {
      FunctionName: lambdaName,
      Description: description,
    };

    if (roleIsBeingUpdated) configParams.Role = updatedRoleArn;
    if (runtimeIsBeingUpdated) configParams.Runtime = runtime;

    const lambdaData = await asyncLambdaUpdateFunctionConfiguration(configParams);
    if (descriptionIsBeingUpdated) await writeLambda(lambdaData, path);
  }
};
