const {
  asyncListFunctions,
  asyncListTables,
  asyncGetResources,
} = require('../aws/awsFunctions');

const {
  bamText,
  indentFurther,
  indentFurthest,
  vertPadding,
} = require('../util/logger');

const { doesApiExist } = require('../aws/doesResourceExist');

const friendlyDataTypes = {
  S: 'string',
  N: 'number',
  B: 'binary',
};

const getMethodsFromAws = async (restApiId) => {
  const resources = (await asyncGetResources({ restApiId })).items;
  const rootResource = resources.find(resource => resource.path === '/');
  return Object.keys(rootResource.resourceMethods);
};

const getLambdaNamesFromAws = async () => {
  const functionsObjects = await asyncListFunctions({});
  const functionNames = functionsObjects.Functions
    .map(functionObj => functionObj.FunctionName);
  return functionNames;
};

const getLocalFunctionsAlsoOnAws = async (path, lambdas, region) => {
  const functionsOnAws = await getLambdaNamesFromAws();
  const regionalFunctions = lambdas[region];
  return Object.keys(regionalFunctions).filter(funcName => (
    functionsOnAws.includes(funcName)
  ));
};

const formatBamFunctionsList = async (funcName, lambdas, apis, region) => {
  const fields = [];

  if (Object.keys(lambdas[region]).length > 0) {
    const funcObj = lambdas[region][funcName];
    const funcNameStr = bamText(`${funcName}`);
    const hasDescription = funcObj.description.trim() !== '';
    const descriptionStr = `${indentFurthest}${bamText('description:')} ${funcObj.description}`;
    fields.push(funcNameStr);
    if (hasDescription) fields.push(descriptionStr);

    if (Object.keys(apis[region]).length > 0) {
      const apiObj = apis[region][funcName];
      const { restApiId } = apiObj;
      const apiExistsOnAws = await doesApiExist(restApiId);

      if (apiObj && apiExistsOnAws) {
        const methods = await getMethodsFromAws(restApiId);
        const endpointStr = `${indentFurthest}${bamText('endpoint:')} ${apiObj.endpoint}`;
        const methodsStr = methods.join(', ');
        const httpMethodsStr = `${indentFurthest}${bamText('http methods:')} ${methodsStr}`;
        fields.push(endpointStr);
        fields.push(httpMethodsStr);
      }
    }
  }
  return fields.join('\n');
};

const getBamFunctionsList = async (path, lambdas, apis, region) => {
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, lambdas, region);
  const numOfLocalFunctionsAlsoOnAws = localFunctionsAlsoOnAws.length;
  const functionsListItems = [];

  for (let i = 0; i < localFunctionsAlsoOnAws.length; i += 1) {
    const funcName = localFunctionsAlsoOnAws[i];
    const listItem = await formatBamFunctionsList(funcName, lambdas, apis, region);
    functionsListItems.push(listItem);
  }

  const functionsList = functionsListItems.join(`${vertPadding}${indentFurther}`);
  return numOfLocalFunctionsAlsoOnAws === 0 ? '' : `${indentFurther}${functionsList}`;
};

const formatAwsFunctionsList = awsFuncs => (
  awsFuncs.map(funcName => (
    `${indentFurther}${funcName}`)).join('\n')
);

const getAwsFunctionsList = async (path, lambdas, region) => {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const localFunctionsAlsoOnAws = await getLocalFunctionsAlsoOnAws(path, lambdas, region);
  const functionsOnlyOnAws = functionsOnAws.filter(funcName => (
    !localFunctionsAlsoOnAws.includes(funcName)));
  const numOfFunctionsOnlyOnAws = functionsOnlyOnAws.length;
  return numOfFunctionsOnlyOnAws === 0 ? '' : formatAwsFunctionsList(functionsOnlyOnAws);
};

const formatTablesList = async (tableName, dbtables, region) => {
  const { partitionKey, sortKey } = dbtables[region][tableName];
  const tableNameStr = bamText(`${tableName}`);
  const partitionKeyDataType = friendlyDataTypes[partitionKey.dataType];
  const partitionKeyStr = `${indentFurthest}${bamText('partition key:')} ${partitionKey.name} (${partitionKeyDataType})`;
  const fields = [tableNameStr, partitionKeyStr];

  if (sortKey) {
    const sortKeyDataType = friendlyDataTypes[sortKey.dataType];
    const sortKeyStr = `${indentFurthest}${bamText('sort key:')} ${sortKey.name} (${sortKeyDataType})`;
    fields.push(sortKeyStr);
  }

  return fields.join('\n');
};

const getFormattedTablesList = async (tableNames, dbtables, region) => {
  const dbListItems = [];

  for (let i = 0; i < tableNames.length; i += 1) {
    const tableName = tableNames[i];
    const listItem = await formatTablesList(tableName, dbtables, region);
    dbListItems.push(listItem);
  }

  return dbListItems.join(`${vertPadding}${indentFurther}`);
};

const getBamTablesList = async (path, dbtables, region) => {
  const tablesNamesOnAws = await asyncListTables();
  const tablesOnAws = tablesNamesOnAws.TableNames;

  const regionalTables = dbtables[region];
  const tableNames = Object.keys(regionalTables).filter(table => tablesOnAws.includes(table));
  const numOfTables = tableNames.length;
  const formattedTablesList = await getFormattedTablesList(tableNames, dbtables, region);

  return numOfTables === 0 ? '' : `${indentFurther}${formattedTablesList}`;
};

module.exports = {
  getLocalFunctionsAlsoOnAws,
  getLambdaNamesFromAws,
  getAwsFunctionsList,
  getBamTablesList,
  getBamFunctionsList,
};
