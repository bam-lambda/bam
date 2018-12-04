const AWS = require('aws-sdk');
const { promisify } = require('util');
const {
  createDirectory,
  readFile,
  copyFile,
  rename,
  copyDir,
  exists,
} = require('../util/fileUtils');
const { zipper } = require('../util/zipper');
const getRegion = require('../util/getRegion');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const updateLambdaConfig = require('./updateLambdaConfig');

const apiVersion = 'latest';
const cwd = process.cwd();

module.exports = async function updateLambda(lambdaName, path, options) {
  const region = await getRegion();
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));

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
