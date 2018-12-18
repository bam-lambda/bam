const { asyncLambdaUpdateFunctionCode } = require('./awsFunctions');
const updateLambdaConfig = require('./updateLambdaConfig');
const { zipper } = require('../util/zipper');
const installLambdaDependencies = require('../util/installLambdaDependencies');
const bamSpinner = require('../util/spinner');

const {
  createDirectory,
  readFile,
  copyFile,
  rename,
  copyDir,
  getStagingPath,
  exists,
} = require('../util/fileUtils');

const cwd = process.cwd();

module.exports = async function updateLambda(lambdaName, path, roleName, dir) {
  const stagingPath = getStagingPath(path);
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

  const createDeployPkg = async () => {
    if (dir) {
      await createDeploymentPackageFromDir();
    } else {
      await createDirectory(`${lambdaName}`, stagingPath);
      await copyFile(`${cwd}/${lambdaName}.js`, `${stagingPath}/${lambdaName}/index.js`);
    }
  };

  bamSpinner.start();
  await createDeployPkg();
  await installLambdaDependencies(lambdaName, path);
  const zippedFileName = await zipper(lambdaName, path, lambdaName);
  const zipContents = await readFile(zippedFileName);

  const updateAwsLambda = async () => {
    await updateLambdaConfig(lambdaName, path, roleName);
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
