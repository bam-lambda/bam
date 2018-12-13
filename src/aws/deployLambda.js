const { asyncLambdaCreateFunction } = require('./awsFunctions');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const {
  bamLog,
  bamWarn,
  msgAfterAction,
} = require('../util/logger');
const {
  createDirectory,
  readConfig,
  copyDir,
  copyFile,
  readFile,
  rename,
  getStagingPath,
  exists,
} = require('../util/fileUtils');

const cwd = process.cwd();

module.exports = async function deployLambda(lambdaName, description, path, roleName) {
  const stagingPath = getStagingPath(path);
  const config = await readConfig(path);
  const { accountNumber } = config;
  const role = roleName || config.role;
  const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
  const renameLambdaFileToIndexJs = async () => {
    await rename(`${stagingPath}/${lambdaName}/${lambdaName}.js`,
      `${stagingPath}/${lambdaName}/index.js`);
  };

  const createDeploymentPackageFromDir = async () => {
    await copyDir(`${cwd}/${lambdaName}`, `${stagingPath}/${lambdaName}`);
    const lambdaNameJSExists = await exists(`${stagingPath}/${lambdaName}/${lambdaName}.js`);
    if (lambdaNameJSExists) await renameLambdaFileToIndexJs();
  };

  const createDeploymentPackage = async () => {
    if (lambdaNameDirExists) {
      await createDeploymentPackageFromDir();
    } else {
      await createDirectory(lambdaName, stagingPath);
      await copyFile(`${cwd}/${lambdaName}.js`, `${stagingPath}/${lambdaName}/index.js`);
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

    const data = await bamBam(asyncLambdaCreateFunction, {
      asyncFuncParams: [createFunctionParams],
    });

    return data;
  };

  const data = await createAwsLambda();

  if (data) {
    bamSpinner.stop();
    bamLog(msgAfterAction('lambda', lambdaName, 'created'));
    return data;
  }

  bamSpinner.stop();
  bamWarn(msgAfterAction('lambda', lambdaName, 'exists', 'already'));
};
