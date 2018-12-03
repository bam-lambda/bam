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

const getFormattedTablesList = (tableNames, tablesConfig) => (
  tableNames.map((tableName) => {
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
  }).join(`${vertPadding}${indentFurther}`)
);

const getBamTablesList = async (path) => {
  const region = await getRegion();
  const dynamo = new AWS.DynamoDB({ apiVersion, region });
  const asyncListTables = promisify(dynamo.listTables.bind(dynamo));
  const tablesNamesOnAws = await asyncListTables();
  const tablesOnAws = tablesNamesOnAws.TableNames;

  const tablesConfigJSON = await readFile(`${path}/.bam/dbTables.json`, 'utf8');
  const tablesConfig = JSON.parse(tablesConfigJSON);
  const tableNames = Object.keys(tablesConfig).filter(table => tablesOnAws.includes(table));
  const numOfTables = tableNames.length;
  const formattedTablesList = getFormattedTablesList(tableNames, tablesConfig);

  return numOfTables === 0 ? '' : `${indentFurther}${formattedTablesList}`;
};

const getLocalFunctionsAlsoOnAws = async (functionsOnAws, library) => (
  Object.keys(library).filter(funcName => (
    functionsOnAws.includes(funcName)
  ))
);

module.exports = {
  getLocalFunctionsAlsoOnAws,
  getLambdaNamesFromAws,
  getAwsFunctionsList,
  getBamTablesList,
  getBamFunctionsList,
};
