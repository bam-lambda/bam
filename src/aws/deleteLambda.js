const AWS = require('aws-sdk');
const { promisify } = require('util');

const getRegion = require('../util/getRegion.js');
const { bamLog, bamError } = require('../util/fancyText.js');
const {
  readFuncLibrary,
  writeFuncLibrary,
  promisifiedRimraf,
} = require('../util/fileUtils');

module.exports = async function deleteLambda(lambdaName, path) {
  const region = await getRegion();
  const apiVersion = 'latest';

  // delete from AWS
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda, {
    FunctionName: lambdaName,
  }));

  try {
    await asyncLambdaDeleteFunction();
  } catch (err) {
    console.log(err, err.stack);
  }

  // delete from local directories
  try {
    await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}`);
  } catch (err) {
    bamError(err);
  }

  // read from library and remove property
  const functions = await readFuncLibrary(path);
  delete functions[lambdaName];

  // write back to library
  await writeFuncLibrary(path, functions);
  bamLog(`Lambda "${lambdaName}" has been deleted`);
};
