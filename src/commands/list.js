const AWS = require('aws-sdk');
const { promisify } = require('util');

const { readFuncLibrary } = require('../util/fileUtils');
const {
  bamText,
  log,
  bamWarn,
  logInColor,
  indent,
  indentFurther,
  indentFurthest,
  vertPadding,
} = require('../util/logger');
const { readFile } = require('../util/fileUtils');
const getRegion = require('../util/getRegion');

const apiVersion = 'latest';

const friendlyDataTypes = {
  S: 'string',
  N: 'number',
  B: 'binary',
};

const getLambdaNamesFromAws = async () => {
  const region = await getRegion();

  const lambda = new AWS.Lambda({ apiVersion, region });
  const listFunctions = promisify(lambda.listFunctions.bind(lambda, {}));
  const functionsObjects = await listFunctions();
  const functionNames = functionsObjects.Functions.map(functionObj => functionObj.FunctionName);
  return functionNames;
};

const getBamFunctionsList = (functionsLocalAndOnAws, library) => {
  const functionsList = functionsLocalAndOnAws.map((funcName) => {
    const funcObj = library[funcName];
    const funcNameStr = bamText(`${funcName}:`);
    const descriptionStr = `${indentFurthest}${bamText('description:')} ${funcObj.description}`;
    const endpointStr = `${indentFurthest}${bamText('url:')} ${funcObj.api.endpoint}`;
    const fields = [funcNameStr, descriptionStr, endpointStr];
    return fields.join('\n');
  }).join(`${vertPadding}${indentFurther}`);

  return `${indentFurther}${functionsList}`;
};

const getAwsFunctionsList = (functionsOnAws, functionsLocalAndOnAws) => {
  const functionsOnlyOnAws = functionsOnAws.filter(funcName => (
    !functionsLocalAndOnAws.includes(funcName)));
  return functionsOnlyOnAws.map(funcName => (
    `${indentFurther}${funcName}`)).join('\n');
};

const getBamTablesList = async (path) => {
  const region = await getRegion();
  const dynamo = new AWS.DynamoDB({ apiVersion, region });
  const asyncListTables = promisify(dynamo.listTables.bind(dynamo));
  const tablesNamesOnAws = await asyncListTables();
  const tablesOnAws = tablesNamesOnAws.TableNames;

  const tablesConfigJSON = await readFile(`${path}/.bam/dbTables.json`, 'utf8');
  const tablesConfig = JSON.parse(tablesConfigJSON);
  const tableNames = Object.keys(tablesConfig).filter(table => tablesOnAws.includes(table));
  const tablesList = tableNames.map((tableName) => {
    const { partitionKey, sortKey } = tablesConfig[tableName];
    const tableNameStr = bamText(`${tableName}:`);
    const partitionKeyDataType = friendlyDataTypes[partitionKey.dataType];
    const partitionKeyStr = `${indentFurthest}${bamText('Partition Key:')} ${partitionKey.name} (${partitionKeyDataType})`;
    const fields = [tableNameStr, partitionKeyStr];

    if (sortKey) {
      const sortKeyDataType = friendlyDataTypes[sortKey.dataType];
      const sortKeyStr = `${indentFurthest}${bamText('sort Key:')} ${sortKey.name} (${sortKeyDataType})`;
      fields.push(sortKeyStr);
    }

    return fields.join('\n');
  }).join(`${vertPadding}${indentFurther}`);

  return `${indentFurther}${tablesList}`;
};

module.exports = async function list(path) {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const library = await readFuncLibrary(path);

  const functionsLocalAndOnAws = Object.keys(library).filter(funcName => (
    functionsOnAws.includes(funcName)
  ));
  const awsFunctionsList = getAwsFunctionsList(functionsOnAws, functionsLocalAndOnAws);
  const bamFunctionsList = getBamFunctionsList(functionsLocalAndOnAws, library);
  const tablesList = await getBamTablesList(path);

  logInColor(`${indent}Lambdas deployed from this machine using BAM:`, 'green');
  log(`${bamFunctionsList}\n`);

  if (awsFunctionsList.length > 0) {
    bamWarn(`${indent}Other lambdas on AWS:`);
    log(`${awsFunctionsList}\n`);
  }

  if (tablesList.length > 0) {
    logInColor(`${indent}DynamoDB tables deployed from this machine using BAM:`, 'green');
    log(`${tablesList}\n`);
  }
};
