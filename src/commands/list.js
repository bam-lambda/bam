const {
  log,
  bamWarn,
  logInColor,
  indent,
} = require('../util/logger');

const { readFuncLibrary } = require('../util/fileUtils');
const checkForOptionType = require('../util/checkForOptionType');
const {
  getLocalFunctionsAlsoOnAws,
  getLambdaNamesFromAws,
  getAwsFunctionsList,
  getBamFunctionsList,
  getBamTablesList,
} = require('../util/listHelpers');

module.exports = async function list(path, options) {
  const library = await readFuncLibrary(path);
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const localFunctionsAlsoOnAws = getLocalFunctionsAlsoOnAws(functionsOnAws, library);

  const awsFunctionsList = getAwsFunctionsList(functionsOnAws, localFunctionsAlsoOnAws);
  const bamFunctionsList = getBamFunctionsList(localFunctionsAlsoOnAws, library);
  const tablesList = await getBamTablesList(path);
  const dbFlag = checkForOptionType(options, 'db');

  if (dbFlag && tablesList.length > 0) {
    logInColor(`${indent}DynamoDB tables deployed from this machine using BAM:`, 'green');
    log(`${tablesList}\n`);
  } else if (dbFlag) {
    bamWarn('No tables on AWS have been deployed from this machine');
  } else {
    logInColor(`${indent}Lambdas deployed from this machine using BAM:`, 'green');
    log(`${bamFunctionsList}\n`);

    if (awsFunctionsList.length > 0) {
      bamWarn(`${indent}Other lambdas on AWS:`);
      log(`${awsFunctionsList}\n`);
    }
  }
};
