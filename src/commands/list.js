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
const {
  readFuncLibrary,
  readFile,
  exists,
} = require('../util/fileUtils');

const logBamFunctions = (bamFunctionsList) => {
  if (bamFunctionsList.length > 0) {
    logInColor(`${indent}Lambdas deployed from this machine using BAM:`, 'green');
    log(`${bamFunctionsList}\n`);
  } else {
    log(`${indent}There are no lambdas on AWS that have been deployed with BAM\n`);
  }
};

const logAwsFunctions = (awsFunctionsList) => {
  if (awsFunctionsList.length > 0) {
    log(`${indent}Other lambdas on AWS:`);
    log(`${awsFunctionsList}\n`);
  }
};

const logBamTables = (bamTablesList) => {
  if (bamTablesList.length > 0) {
    logInColor(`${indent}DynamoDB tables deployed from this machine using BAM:`, 'green');
    log(`${bamTablesList}\n`);
  } else {
    log(`${indent}No tables on AWS have been deployed from this machine\n`);
  }
};

module.exports = async function list(path, options) {
  let library = {};
  let bamFunctionsList = [];
  const libraryFileExists = await exists(`${path}/.bam/functions/library.json`);
  if (libraryFileExists) {
    library = await readFuncLibrary(path) || {};
    bamFunctionsList = await getBamFunctionsList(path, library);
  }
  const awsFunctionsList = await getAwsFunctionsList(path, library);

  let dbtables = {};
  let bamTablesList = [];
  const dbtablesFilePath = `${path}/.bam/dbtables.json`;
  const dbtablesFileExists = await exists(dbtablesFilePath);
  if (dbtablesFileExists) {
    const dbtablesJSON = await readFile(dbtablesFilePath, 'utf8');
    dbtables = JSON.parse(dbtablesJSON);
    bamTablesList = await getBamTablesList(path, dbtables);
  }

  const dbFlag = checkForOptionType(options, 'db');
  const lambdaFlag = checkForOptionType(options, 'lambda');

  if (lambdaFlag) {
    logBamFunctions(bamFunctionsList);
    logAwsFunctions(awsFunctionsList);
  } else if (dbFlag) {
    logBamTables(bamTablesList);
  } else {
    logBamFunctions(bamFunctionsList);
    logAwsFunctions(awsFunctionsList);
    logBamTables(bamTablesList);
  }
};
