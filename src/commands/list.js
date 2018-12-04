const {
  log,
  logInColor,
  indent,
} = require('../util/logger');
const {
  getAwsFunctionsList,
  getBamFunctionsList,
  getBamTablesList,
} = require('../util/listHelpers');
const checkForOptionType = require('../util/checkForOptionType');
const { readFuncLibrary } = require('../util/fileUtils');

module.exports = async function list(path, options) {
  const library = await readFuncLibrary(path);
  const awsFunctionsList = await getAwsFunctionsList(path, library);
  const bamFunctionsList = await getBamFunctionsList(path, library);
  const tablesList = await getBamTablesList(path);
  const dbFlag = checkForOptionType(options, 'db');

  // TODO: pull out log & msg & if else into:
  //    listBamLambdas
  //    listAwsLambdas
  //    listBamTables

  if (dbFlag && tablesList.length > 0) {
    logInColor(`${indent}DynamoDB tables deployed from this machine using BAM:`, 'green');
    log(`${tablesList}\n`);
  } else if (dbFlag) {
    log(`${indent}No tables on AWS have been deployed from this machine\n`);
  } else {
    if (bamFunctionsList.length > 0) {
      logInColor(`${indent}Lambdas deployed from this machine using BAM:`, 'green');
      log(`${bamFunctionsList}\n`);
    } else {
      log(`${indent}There are no lambdas on AWS that have been deployed with BAM\n`);
    }
    if (awsFunctionsList.length > 0) {
      log(`${indent}Other lambdas on AWS:`);
      log(`${awsFunctionsList}\n`);
    }
  }
};
