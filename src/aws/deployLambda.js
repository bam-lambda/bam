const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const zipper = require('../util/zipper.js');
const installLambdaDependencies = require('../util/installLambdaDependencies.js');
const bamBam = require('../util/bamBam.js');

const apiVersion = 'latest';

module.exports = async function deployLambda(lambdaName, description, path = '.') {
  const config = JSON.parse(fs.readFileSync(`${path}/bam/config.json`));
  const { accountNumber, region, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));

  await installLambdaDependencies(lambdaName, path);
  const zippedFileName = await zipper(lambdaName, path);
  const zipContents = fs.readFileSync(zippedFileName);

  const createAwsLambda = async () => {
    const params = {
      Code: {
        ZipFile: zipContents,
      },
      FunctionName: lambdaName,
      Handler: 'index.handler',
      Role: `arn:aws:iam::${accountNumber}:role/${role}`,
      Runtime: 'nodejs8.10',
      Description: description,
    };

    const actionStr = `deploy ${lambdaName}`;
    const successStr = `deployed ${lambdaName}`;
    return bamBam(asyncLambdaCreateFunction, params, actionStr, successStr);
  };

  const writeToLib = (data) => {
    const name = data.FunctionName;
    const arn = data.FunctionArn;

    // read contents from library
    const functions = JSON.parse(fs.readFileSync(`${path}/bam/functions/library.json`));
    functions[name] = { arn, description };

    // write back to library
    fs.writeFileSync(`${path}/bam/functions/library.json`, JSON.stringify(functions));
    console.log(`${lambdaName} has been deployed. Check out ${path}/bam/functions/library.json`);
  };

  const data = await createAwsLambda();
  if (data) await writeToLib(data);
};