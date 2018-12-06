const { asyncLambdaCreateFunction } = require('./awsFunctions');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const {
  bamLog,
  bamWarn,
} = require('../util/logger');
const {
  createDirectory,
  writeLambda,
  readConfig,
  copyDir,
  copyFile,
  readFile,
  rename,
  exists,
} = require('../util/fileUtils');

const cwd = process.cwd();

module.exports = async function deployLambda(lambdaName, description, path, roleName) {
  const config = await readConfig(path);
  const { accountNumber } = config;
  const role = roleName || config.role;
console.log(role, roleName, config.role)  
  const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
  const renameLambdaFileToIndexJs = async () => {
    await rename(`${path}/.bam/functions/${lambdaName}/${lambdaName}.js`,
      `${path}/.bam/functions/${lambdaName}/index.js`);
  };

  const createDeploymentPackageFromDir = async () => {
    await copyDir(`${cwd}/${lambdaName}`, `${path}/.bam/functions/${lambdaName}`);
    const lambdaNameJSExists = await exists(`${path}/.bam/functions/${lambdaName}/${lambdaName}.js`);
    if (lambdaNameJSExists) await renameLambdaFileToIndexJs();
  };

  const createDeploymentPackage = async () => {
    if (lambdaNameDirExists) {
      await createDeploymentPackageFromDir();
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

    const data = await bamBam(asyncLambdaCreateFunction, {
      asyncFuncParams: [createFunctionParams],
    });

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
