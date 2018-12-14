const deployLambda = require('../aws/deployLambda');
const deployApi = require('../aws/deployApi');
const getUserInput = require('../util/getUserInput');
const checkForOptionType = require('../util/checkForOptionType');
const getOption = require('../util/getOption');

const {
  bamWarn,
  bamError,
  msgAfterAction,
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

  const question = {
    question: 'Please provide a brief description of your lambda: ',
    validator: () => (true),
    feedback: 'invalid description',
    defaultAnswer: '',
  };

  try {
    const input = await getUserInput([question]);
    if (input === undefined) {
      bamWarn(msgAfterAction('lambda', resourceName, 'aborted', 'creation has been'));
      return;
    }

    const [description] = input;
    const lambdaData = await deployLambda(resourceName, description, path, roleName);
    if (lambdaData) await writeLambda(lambdaData, path, description);
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
