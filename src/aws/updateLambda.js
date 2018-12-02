const AWS = require('aws-sdk');
const { promisify } = require('util');
const getLambda = require('./getLambda');
const {
  createDirectory,
  readFile,
  copyFile,
  readConfig,
  rename,
  copyDir,
  exists,
} = require('../util/fileUtils');
const { bamError } = require('../util/logger');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');

const apiVersion = 'latest';
const cwd = process.cwd();

const dbRole = 'databaseBamRole'; // TODO -- refactor for testing
const getRole = async (lambdaName) => {
  try {
    const data = await getLambda(lambdaName);
    return data.Configuration.Role;
  } catch (err) {
    bamError(err);
    return err;
  }
};

module.exports = async function updateLambda(lambdaName, path, dbFlag) {
  const config = await readConfig(path);
  const { region, accountNumber } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));
  const asyncLambdaUpdateFunctionConfiguration = promisify(lambda.updateFunctionConfiguration.bind(lambda));
  const databaseRoleArn = `arn:aws:iam::${accountNumber}:role/${dbRole}`;
  const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
  const renameLambdaFileToIndexJs = async () => {
    await rename(`${path}/.bam/functions/${lambdaName}-temp/${lambdaName}.js`,
      `${path}/.bam/functions/${lambdaName}-temp/index.js`);
  };

  const createDeploymentPackageFromDir = async () => {
    await copyDir(`${cwd}/${lambdaName}`, `${path}/.bam/functions/${lambdaName}-temp`);
    const lambdaNameJSExists = await exists(`${path}/.bam/functions/${lambdaName}-temp/${lambdaName}.js`);
    if (lambdaNameJSExists) await renameLambdaFileToIndexJs();
  };

  const createTempDeployPkg = async () => {
    if (lambdaNameDirExists) {
      await createDeploymentPackageFromDir();
    } else {
      await createDirectory(`${lambdaName}-temp`, `${path}/.bam/functions`);
      await copyFile(`${cwd}/${lambdaName}.js`, `${path}/.bam/functions/${lambdaName}-temp/index.js`);
    }
  };

  bamSpinner.start();
  await createTempDeployPkg();
  await installLambdaDependencies(`${lambdaName}-temp`, path);
  const zippedFileName = await zipper(lambdaName, path, `${lambdaName}-temp`);
  const zipContents = await readFile(zippedFileName);

  const updateAwsLambda = async () => {
    const currentRoleArn = await getRole(lambdaName);
    if (dbFlag && currentRoleArn !== databaseRoleArn) {
      const configParams = {
        FunctionName: lambdaName,
        Role: databaseRoleArn,
      };
      await asyncLambdaUpdateFunctionConfiguration(configParams);
    }

    const codeParams = {
      FunctionName: lambdaName,
      ZipFile: zipContents,
    };
    const data = await bamBam(asyncLambdaUpdateFunctionCode, { params: [codeParams] });
    return data;
  };

  const data = await updateAwsLambda();
  bamSpinner.stop();
  return data;
};
