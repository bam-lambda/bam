const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('./getRegion.js');


module.exports = async function deleteLambda(lambdaName, src) {
  const region = getRegion();
  const apiVersion = 'latest';

  // delete from AWS
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda, { FunctionName: lambdaName }));
  await asyncLambdaDeleteFunction();

  // delete from local directories
  fs.unlinkSync(`${src}/bam/functions/${lambdaName}/index.js`);
  fs.unlinkSync(`${src}/bam/functions/${lambdaName}/${lambdaName}.zip`);
  fs.rmdirSync(`${src}/bam/functions/${lambdaName}`);

  // read from library and remove property
  const functions = JSON.parse(fs.readFileSync(`${src}/bam/functions/library.json`));
  delete functions[lambdaName];

  // write back to library
  fs.writeFileSync(`${src}/bam/functions/library.json`, JSON.stringify(functions));
  console.log(`${lambdaName} has been deleted.`);
}
