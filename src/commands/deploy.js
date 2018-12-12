const deployLambda = require('../aws/deployLambda');
const deployApi = require('../aws/deployApi');
const getUserInput = require('../util/getUserInput');
const checkForOptionType = require('../util/checkForOptionType');

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

module.exports = async function deploy(lambdaName, path, options) {
  const deployLambdaOnly = checkForOptionType(options, 'lambda');
  const permitDb = checkForOptionType(options, 'db');

  const userRole = options.role && options.role[0];
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

  const invalidLambdaMsg = await validateLambdaDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const methods = options.methods || options.method;
  const httpMethods = methods ? methods.map(m => m.toUpperCase()) : ['GET'];
  const invalidApiMsg = await validateApiMethods(httpMethods);
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
      bamWarn(msgAfterAction('lambda', lambdaName, 'aborted', 'creation has been'));
      return;
    }
    const [description] = input;
    const lambdaData = await deployLambda(lambdaName, description, path, roleName);
    if (lambdaData) await writeLambda(lambdaData, path, description);
    if (deployLambdaOnly) return;
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stage);
    if (restApiId) await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
    await deleteStagingDirForLambda(lambdaName, path);
  } catch (err) {
    bamError(err);
  }
};
