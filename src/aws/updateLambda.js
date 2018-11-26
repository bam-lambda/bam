const AWS = require('aws-sdk');
const { promisify } = require('util');
const { createDirectory, readFile, copyFile, readConfig } = require('../util/fileUtils');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const {
  bamLog,
  bamWarn,
  bamSpinner,
} = require('../util/logger');

const apiVersion = 'latest';

module.exports = async function updateLambda(lambdaName, path) {
  const config = await readConfig(path);
  const { accountNumber, region, role } = config;
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
    const sdkParams = {
      FunctionName: lambdaName,
      ZipFile: zipContents,
    };
    const data = await bamBam(asyncLambdaUpdateFunctionCode, { params: [sdkParams] });
    return data;
  };

  const data = await updateAwsLambda();
  bamSpinner.stop(); 
  return data;
};
