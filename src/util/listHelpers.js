const AWS = require('aws-sdk');
const { promisify } = require('util');

const {
  bamText,
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
  const functionNames = functionsObjects.Functions
    .map(functionObj => functionObj.FunctionName);
  return functionNames;
};

const getLocalFunctionsAlsoOnAws = async (path, library) => {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  return Object.keys(library).filter(funcName => (
    functionsOnAws.includes(funcName)
  ));
};

const formatBamFunctionsList = (funcName, library) => {
  const funcObj = library[funcName];
  const funcNameStr = bamText(`${funcName}:`);
  const descriptionStr = `${indentFurthest}${bamText('description:')} ${funcObj.description}`;
  const endpointStr = `${indentFurthest}${bamText('url:')} ${funcObj.api.endpoint}`;
  const fields = [funcNameStr, descriptionStr, endpointStr];
  return fields.join('\n');
};

const getBamFunctionsList = async (path, library) => {
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, library);
  const numOfLocalFunctionsAlsoOnAws = localFunctionsAlsoOnAws.length;

  const functionsList = localFunctionsAlsoOnAws.map(funcName => (
    formatBamFunctionsList(funcName, library)
  )).join(`${vertPadding}${indentFurther}`);

  return numOfLocalFunctionsAlsoOnAws === 0 ? '' : `${indentFurther}${functionsList}`;
};

const formatAwsFunctionsList = awsFuncs => (
  awsFuncs.map(funcName => (
    `${indentFurther}${funcName}`)).join('\n')
);

const getAwsFunctionsList = async (path, library) => {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, library);
  const functionsOnlyOnAws = functionsOnAws.filter(funcName => (
    !localFunctionsAlsoOnAws.includes(funcName)));
  const numOfFunctionsOnlyOnAws = functionsOnlyOnAws.length;
  return numOfFunctionsOnlyOnAws === 0 ? '' : formatAwsFunctionsList(functionsOnlyOnAws);
};

const formatTablesList = (tableName, dbtables) => {
  const { partitionKey, sortKey } = dbtables[tableName];
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
};

const getFormattedTablesList = (tableNames, dbtables) => (
  tableNames.map(tableName => (
    formatTablesList(tableName, dbtables)
  )).join(`${vertPadding}${indentFurther}`)
);

const getBamTablesList = async (path, dbtables) => {
  const region = await getRegion();
  const dynamo = new AWS.DynamoDB({ apiVersion, region });
  const asyncListTables = promisify(dynamo.listTables.bind(dynamo));
  const tablesNamesOnAws = await asyncListTables();
  const tablesOnAws = tablesNamesOnAws.TableNames;

  const tableNames = Object.keys(dbtables).filter(table => tablesOnAws.includes(table));
  const numOfTables = tableNames.length;
  const formattedTablesList = getFormattedTablesList(tableNames, dbtables);

  return numOfTables === 0 ? '' : `${indentFurther}${formattedTablesList}`;
};

module.exports = {
  getLocalFunctionsAlsoOnAws,
  getLambdaNamesFromAws,
  getAwsFunctionsList,
  getBamTablesList,
  getBamFunctionsList,
};
