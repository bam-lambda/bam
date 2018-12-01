const AWS = require('aws-sdk');
const { promisify } = require('util');
const { createDirectory } = require('../util/fileUtils');
const { zipper } = require('../util/zipper.js');
const installLambdaDependencies = require('../util/installLambdaDependencies.js');
const bamBam = require('../util/bamBam.js');
const bamSpinner = require('../util/spinner');

const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

const {
  bamLog,
  bamWarn,
} = require('../util/logger');

const {
  writeLambda,
  readConfig,
  copyDir,
  copyFile,
  readFile,
  rename,
  exists,
} = require('../util/fileUtils');

const apiVersion = 'latest';

module.exports = async function deployLambda(lambdaName, description, path, dbFlag) {
  const config = await readConfig(path);
  const { accountNumber, region } = config;
  const role = dbFlag ? dbRole : config.role;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda));

  const createDeploymentPackage = async () => {
    const cwd = process.cwd();
    const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
    if (lambdaNameDirExists) {
      await copyDir(`${cwd}/${lambdaName}`, `${path}/.bam/functions/${lambdaName}`);
      const lambdaNameJSExists = await exists(`${path}/.bam/functions/${lambdaName}/${lambdaName}.js`);
      if (lambdaNameJSExists) {
        await rename(`${path}/.bam/functions/${lambdaName}/${lambdaName}.js`,
          `${path}/.bam/functions/${lambdaName}/index.js`);
      }
    } else {
      await createDirectory(lambdaName, `${path}/.bam/functions`);
      await copyFile(`${cwd}/${lambdaName}.js`, `${path}/.bam/functions/${lambdaName}/index.js`);
    }
  };

  bamSpinner.start();
  await createDeploymentPackage();
  await installLambdaDependencies(lambdaName, path);
  const zippedFileName = await zipper(lambdaName, path);
  const zipContents = await readFile(zippedFileName);

  const createAwsLambda = async () => {
    const createFunctionParams = {
      Code: {
        ZipFile: zipContents,
      },
      FunctionName: lambdaName,
      Handler: 'index.handler',
      Role: `arn:aws:iam::${accountNumber}:role/${role}`,
      Runtime: 'nodejs8.10',
      Description: description,
    };

    const data = await bamBam(asyncLambdaCreateFunction, { params: [createFunctionParams] });
    return data;
  };

  const data = await createAwsLambda();

  if (data) {
    await writeLambda(data, path);
    bamSpinner.stop();
    bamLog(`Lambda "${lambdaName}" has been created`);
    return data;
  }

  bamSpinner.stop();
  bamWarn(`Lambda "${lambdaName}" already exists`);
};
