const { asyncLambdaUpdateFunctionCode } = require('./awsFunctions');
const {
  createDirectory,
  readFile,
  copyFile,
  rename,
  copyDir,
  getStagingPath,
  exists,
} = require('../util/fileUtils');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamSpinner = require('../util/spinner');
const updateLambdaConfig = require('./updateLambdaConfig');

const cwd = process.cwd();

module.exports = async function updateLambda(lambdaName, path, options) {
  const stagingPath = getStagingPath(path);
  const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
  const renameLambdaFileToIndexJs = async () => {
    await rename(`${stagingPath}/${lambdaName}-temp/${lambdaName}.js`,
      `${stagingPath}/${lambdaName}-temp/index.js`);
  };

  const createDeploymentPackageFromDir = async () => {
    await copyDir(`${cwd}/${lambdaName}`, `${stagingPath}/${lambdaName}-temp`);
    const lambdaNameJSExists = await exists(`${stagingPath}/${lambdaName}-temp/${lambdaName}.js`);
    if (lambdaNameJSExists) await renameLambdaFileToIndexJs();
  };

  const createTempDeployPkg = async () => {
    if (lambdaNameDirExists) {
      await createDeploymentPackageFromDir();
    } else {
      await createDirectory(`${lambdaName}-temp`, stagingPath);
      await copyFile(`${cwd}/${lambdaName}.js`, `${stagingPath}/${lambdaName}-temp/index.js`);
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
    const data = await asyncLambdaUpdateFunctionCode(codeParams);
    return data;
  };

  const data = await updateAwsLambda();
  bamSpinner.stop();
  return data;
};
