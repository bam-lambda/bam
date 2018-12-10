const { bamWarn } = require('../util/logger');
const { validateLambdaCreation } = require('../util/validations');
const checkForOptionType = require('../util/checkForOptionType');

const {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
} = require('../util/createLocalLambda');

module.exports = async function create(lambdaName, options) {
  const invalidLambdaMsg = await validateLambdaCreation(lambdaName);
  const createDirTemplate = checkForOptionType(options, 'dir');
  const createIinvokerTemplate = checkForOptionType(options, 'invoke');

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  if (createDirTemplate) { // TODO pick more descriptive flag
    await createLocalLambdaDirectory(lambdaName, createIinvokerTemplate);
  } else {
    await createLocalLambdaFile(lambdaName, createIinvokerTemplate);
  }
};
