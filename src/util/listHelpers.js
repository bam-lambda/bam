const {
  asyncListFunctions,
  asyncListTables,
} = require('../aws/awsFunctions');

const {
  bamText,
  indentFurther,
  indentFurthest,
  vertPadding,
} = require('../util/logger');

const { asyncGetRegion } = require('./getRegion');

const friendlyDataTypes = {
  S: 'string',
  N: 'number',
  B: 'binary',
};

const getLambdaNamesFromAws = async () => {
  const functionsObjects = await asyncListFunctions({});
  const functionNames = functionsObjects.Functions
    .map(functionObj => functionObj.FunctionName);
  return functionNames;
};

const getLocalFunctionsAlsoOnAws = async (path, lambdas) => {
  const region = await asyncGetRegion();
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const regionalFunctions = lambdas[region];
  return Object.keys(regionalFunctions).filter(funcName => (
    functionsOnAws.includes(funcName)
  ));
};

const formatBamFunctionsList = async (funcName, lambdas, apis) => {
  const region = await asyncGetRegion();
  const fields = [];

  if (Object.keys(lambdas[region]).length > 0) {
    const funcObj = lambdas[region][funcName];
    const funcNameStr = bamText(`${funcName}:`);
    const descriptionStr = `${indentFurthest}${bamText('description:')} ${funcObj.description}`;
    fields.push(funcNameStr);
    fields.push(descriptionStr);

    if (Object.keys(apis[region]).length > 0) {
      const apiObj = apis[region][funcName];
      if (apiObj) {
        const endpointStr = `${indentFurthest}${bamText('url:')} ${apiObj.endpoint}`;
        const methodsStr = apiObj.methods.join(', ');
        const httpMethodsStr = `${indentFurthest}${bamText('http methods:')} ${methodsStr}`;
        fields.push(endpointStr);
        fields.push(httpMethodsStr);
      }
    }
  }
  return fields.join('\n');
};

const getBamFunctionsList = async (path, lambdas, apis) => {
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, lambdas);
  const numOfLocalFunctionsAlsoOnAws = localFunctionsAlsoOnAws.length;
  const functionsListItems = [];

  for (let i = 0; i < localFunctionsAlsoOnAws.length; i += 1) {
    const funcName = localFunctionsAlsoOnAws[i];
    const listItem = await formatBamFunctionsList(funcName, lambdas, apis);
    functionsListItems.push(listItem);
  }

  const functionsList = functionsListItems.join(`${vertPadding}${indentFurther}`);
  return numOfLocalFunctionsAlsoOnAws === 0 ? '' : `${indentFurther}${functionsList}`;
};

const formatAwsFunctionsList = awsFuncs => (
  awsFuncs.map(funcName => (
    `${indentFurther}${funcName}`)).join('\n')
);

const getAwsFunctionsList = async (path, lambdas) => {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, lambdas);
  const functionsOnlyOnAws = functionsOnAws.filter(funcName => (
    !localFunctionsAlsoOnAws.includes(funcName)));
  const numOfFunctionsOnlyOnAws = functionsOnlyOnAws.length;
  return numOfFunctionsOnlyOnAws === 0 ? '' : formatAwsFunctionsList(functionsOnlyOnAws);
};

const formatTablesList = async (tableName, dbtables) => {
  const region = await asyncGetRegion();
  const { partitionKey, sortKey } = dbtables[region][tableName];
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

const getFormattedTablesList = async (tableNames, dbtables) => {
  const dbListItems = [];

  for (let i = 0; i < tableNames.length; i += 1) {
    const tableName = tableNames[i];
    const listItem = await formatTablesList(tableName, dbtables);
    dbListItems.push(listItem);
  }

  return dbListItems.join(`${vertPadding}${indentFurther}`);
};

const getBamTablesList = async (path, dbtables) => {
  const region = await asyncGetRegion();
  const tablesNamesOnAws = await asyncListTables();
  const tablesOnAws = tablesNamesOnAws.TableNames;

  const regionalTables = dbtables[region];
  const tableNames = Object.keys(regionalTables).filter(table => tablesOnAws.includes(table));
  const numOfTables = tableNames.length;
  const formattedTablesList = await getFormattedTablesList(tableNames, dbtables);

  return numOfTables === 0 ? '' : `${indentFurther}${formattedTablesList}`;
};

module.exports = {
  getLocalFunctionsAlsoOnAws,
  getLambdaNamesFromAws,
  getAwsFunctionsList,
  getBamTablesList,
  getBamFunctionsList,
};
