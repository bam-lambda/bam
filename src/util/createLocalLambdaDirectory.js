const { copyFile, mkdir } = require('./fileUtils');

module.exports = async function createLocalLambdaDirectory(lambdaName, options) {
  await mkdir(lambdaName);
  await copyFile(, `${cwd}/${lambdaName}/${lambdaName}.js`);
  const cwd = process.cwd();

}
