const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const createDirectory = require('../util/createDirectory');
const zipper = require('../util/zipper.js');
const installLambdaDependencies = require('../util/installLambdaDependencies.js');
const bamBam = require('../util/bamBam.js');
const { writeLambda } = require('../util/writeToLib');
const {
  bamLog,
  bamWarn,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

const apiVersion = 'latest';

module.exports = async function deployLambda(lambdaName, description, path) {
  const config = JSON.parse(fs.readFileSync(`${path}/.bam/config.json`));
  const { accountNumber, region, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));

  const createDeploymentPackage = () => {
    const cwd = process.cwd();
    createDirectory(lambdaName, `${path}/.bam/functions`);
    fs.copyFileSync(`${cwd}/${lambdaName}.js`, `${path}/.bam/functions/${lambdaName}/index.js`);
  };

  const spinnerInterval = bamSpinner();
  createDeploymentPackage();
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

  const data = await createAwsLambda();

  if (data) {
    //await writeToLib(data);
    await writeLambda(data, path)
    clearInterval(spinnerInterval);
    spinnerCleanup();
    bamLog(`Lambda "${lambdaName}" has been created`);
    return data;
  } else {
    clearInterval(spinnerInterval);
    spinnerCleanup();
    bamWarn(`Lambda "${lambdaName}" already exists`);
  }
};
