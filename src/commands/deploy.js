const deployLambda = require('../aws/deployLambda');
const deployApi = require('../aws/deployApi');
const getUserInput = require('../util/getUserInput');
const { bamWarn, bamError } = require('../util/logger');
const checkForOptionType = require('../util/checkForOptionType');
const getOption = require('../util/getOption');

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

  const invalidLambdaMsg = await validateLambdaDeployment(lambdaName);
  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const methodOption = getOption(options, 'method');
  const methods = options[methodOption];
  const httpMethods = methods ? methods.map(m => m.toUpperCase()) : ['GET'];

  const invalidApiMsg = await validateApiMethods(httpMethods);
  if (invalidApiMsg) {
    bamWarn(invalidApiMsg);
    return;
  }

  const question = {
    question: 'Please give a brief description of your lambda: ',
    validator: () => (true),
    feedback: 'invalid description',
    defaultAnswer: '',
  };

  try {
    const input = await getUserInput([question]);
    if (input === undefined) {
      bamWarn('Lambda deployment aborted');
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
