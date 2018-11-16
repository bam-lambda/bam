const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('../util/getRegion.js');
const rimraf = require('rimraf');

const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));

module.exports = async function deleteLambda(lambdaName, path = '.') {
  const region = getRegion();
  const apiVersion = 'latest';

  // delete from AWS
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda, {
    FunctionName: lambdaName,
  }));
  await asyncLambdaDeleteFunction();

  // delete from local directories
  try {
    await asyncRimRaf(`${path}/bam/functions/${lambdaName}`);
  } catch (err) {
    console.log(err);
  }

  // read from library and remove property
  const functions = JSON.parse(fs.readFileSync(`${path}/bam/functions/library.json`));
  delete functions[lambdaName];

  // write back to library
  fs.writeFileSync(`${path}/bam/functions/library.json`, JSON.stringify(functions));
  console.log(`${lambdaName} has been deleted.`);
};
