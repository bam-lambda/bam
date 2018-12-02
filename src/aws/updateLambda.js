const AWS = require('aws-sdk');
const { promisify } = require('util');
const getLambda = require('./getLambda');
const {
  createDirectory,
  readFile,
  copyFile,
  readConfig,
} = require('../util/fileUtils');
const { bamError } = require('../util/logger');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');

const updateLambdaConfig = require('./updateLambdaConfig');

const apiVersion = 'latest';

module.exports = async function updateLambda(lambdaName, path, options) {
  const config = await readConfig(path);
  const { region, accountNumber, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));

  const createTempDeployPkg = async () => {
    const cwd = process.cwd();
    await createDirectory(`${lambdaName}-temp`, `${path}/.bam/functions`);
    await copyFile(`${cwd}/${lambdaName}.js`, `${path}/.bam/functions/${lambdaName}-temp/index.js`);
  };

  bamSpinner.start();
  await createTempDeployPkg();
  await installLambdaDependencies(`${lambdaName}-temp`, path);
  const zippedFileName = await zipper(lambdaName, path, `${lambdaName}-temp`);
  const zipContents = await readFile(zippedFileName);

  const updateAwsLambda = async () => {
    await updateLambdaConfig(lambdaName, path, options);
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
