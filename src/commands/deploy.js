const deployLambda = require('../aws/deployLambda');
const deployApi = require('../aws/deployApi');
const checkForOptionType = require('../util/checkForOptionType');
const getOption = require('../util/getOption');

const {
  bamWarn,
  bamError,
} = require('../util/logger');

const {
  validateLambdaDeployment,
  validateApiMethods,
  validateRoleAssumption,
} = require('../util/validations');

const {
  writeLambda,
  writeApi,
  deleteStagingDirForLambda,
} = require('../util/fileUtils');

const stage = 'bam';
const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

module.exports = async function deploy(resourceName, path, options) {
  const deployLambdaOnly = checkForOptionType(options, 'lambda');
  const permitDb = checkForOptionType(options, 'db');
  const roleOption = getOption(options, 'role');

  const userRole = options[roleOption] && options[roleOption][0];
  let roleName;
  if (permitDb) roleName = dbRole;
  if (userRole) {
    const invalidRoleMsg = await validateRoleAssumption(userRole);
    if (invalidRoleMsg) {
      bamWarn(invalidRoleMsg);
      return;
    }
    roleName = userRole;
  }

  const invalidLambdaMsg = await validateLambdaDeployment(resourceName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const methodOption = getOption(options, 'method');
  const methods = options[methodOption];
  const httpMethods = methods ? methods.map(m => m.toUpperCase()) : ['GET'];

  const validateMethodsParams = {
    addMethods: httpMethods,
    resourceName,
    path,
  };

  const invalidApiMsg = await validateApiMethods(validateMethodsParams);
  if (invalidApiMsg) {
    bamWarn(invalidApiMsg);
    return;
  }

  try {
    const lambdaData = await deployLambda(resourceName, path, roleName);
    if (lambdaData) await writeLambda(lambdaData, path);
    if (deployLambdaOnly) return;

    const {
      restApiId,
      endpoint,
      methodPermissionIds,
    } = await deployApi(resourceName, path, httpMethods, stage);

    const writeParams = [
      endpoint,
      methodPermissionIds,
      resourceName,
      restApiId,
      path,
    ];

    if (restApiId) await writeApi(...writeParams);
    await deleteStagingDirForLambda(resourceName, path);
  } catch (err) {
    bamError(err);
  }
};
