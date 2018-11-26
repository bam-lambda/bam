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
const { readConfig } = require('../util/fileUtils');

const apiVersion = 'latest';

const getLambdaNamesFromAws = async (path) => {
  const config = await readConfig(path);
  const { region } = config;

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

const getAwsFunctionsList = async (functionsOnAws, functionsLocalAndOnAws) => {
  const functionsOnlyOnAws = functionsOnAws.filter(funcName => (
    !functionsLocalAndOnAws.includes(funcName)));
  return functionsOnlyOnAws.map(funcName => (
    `${indentFurther}${funcName}`)).join('\n');
};

module.exports = async function list(path) {
  const functionsOnAws = await getLambdaNamesFromAws(path);
  const library = await readFuncLibrary(path);

  const functionsLocalAndOnAws = Object.keys(library).filter(funcName => (
    functionsOnAws.includes(funcName)
  ));
  const awsFunctionsList = await getAwsFunctionsList(functionsOnAws, functionsLocalAndOnAws);
  const bamFunctionsList = getBamFunctionsList(functionsLocalAndOnAws, library);

  logInColor(`\n${indent}Lambdas deployed from this machine using BAM:`, 'green');
  log(`${bamFunctionsList}\n`);

  if (awsFunctionsList.length > 0) {
    bamWarn(`${indent}Other lambdas on AWS:`);
    log(`${awsFunctionsList}\n`);
  }
};
