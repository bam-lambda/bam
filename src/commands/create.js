const { writeFile, readFile } = require('../util/fileUtils');
const { bamWarn, bamLog } = require('../util/logger');
const { validateLambdaCreation } = require('../util/validations');
const { asyncGetRegion } = require('../util/getRegion');
const { 
  createLocalLambdaFile,
  createLocalLambdaDirectory,
} = require('../util/createLocalLambda');

module.exports = async function create(lambdaName, options) {
  const invalidLambdaMsg = await validateLambdaCreation(lambdaName);

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  if (options.dir) { // TODO pick more descriptive flag
    await createLocalLambdaDirectory(lambdaName, options);
  } else {  
    await createLocalLambdaFile(lambdaName, options);
  }
};
