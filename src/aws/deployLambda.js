const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const zipper = require('../util/zipper.js');
const installLambdaDependencies = require('../util/installLambdaDependencies.js');
const bamBam = require('../util/bamBam.js');
const {
  bamLog,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

const apiVersion = 'latest';

module.exports = async function deployLambda(lambdaName, description, path = '.') {
  const config = JSON.parse(fs.readFileSync(`${path}/bam/config.json`));
  const { accountNumber, region, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));

  const spinnerInterval = bamSpinner();

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

    return bamBam(asyncLambdaCreateFunction, params);
  };

  const writeToLib = (data) => {
    const name = data.FunctionName;
    const arn = data.FunctionArn;

    // read contents from library
    const functions = JSON.parse(fs.readFileSync(`${path}/bam/functions/library.json`));
    functions[name] = { arn, description };

    // write back to library
    fs.writeFileSync(`${path}/bam/functions/library.json`, JSON.stringify(functions));
  };

  // add try/catch here??
  // if so, add bamError
  const data = await createAwsLambda();
  if (data) await writeToLib(data);

  clearInterval(spinnerInterval);
  spinnerCleanup();
  bamLog(`Lambda "${lambdaName}" has been created`);
};
