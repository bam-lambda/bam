const https = require('https');

const { asyncGetFunction } = require('../aws/awsFunctions');

const {
  bamLog,
  bamWarn,
  bamError,
} = require('../util/logger');

const {
  createWriteStream,
  createDirectory,
  unlink,
  rename,
} = require('../util/fileUtils');

const bamSpinner = require('../util/spinner');
const { unzipper } = require('../util/zipper');
const { validateLambdaRetrieval } = require('../util/validations');

const cwd = process.cwd();

const addLambdaFolderToCwd = async (lambdaName, location) => {
  const zipFileName = `${lambdaName}.zip`;
  await createDirectory(lambdaName, cwd);
  const file = createWriteStream(`${cwd}/${lambdaName}/${zipFileName}`);
  return new Promise((res) => {
    https.get(location, async (response) => {
      response.pipe(file);
      file.on('finish', async () => {
        await unzipper(lambdaName);
        await rename(`${cwd}/${lambdaName}/index.js`, `${cwd}/${lambdaName}/${lambdaName}.js`);
        await unlink(`${cwd}/${lambdaName}/${zipFileName}`);
        res();
      });
    });
  });
};

module.exports = async function get(lambdaName) {
  bamSpinner.start();
  const invalidLambdaMsg = await validateLambdaRetrieval(lambdaName);

  if (invalidLambdaMsg) {
    bamSpinner.stop();
    bamWarn(invalidLambdaMsg);
    return;
  }

  const getFunctionParams = { FunctionName: lambdaName };

  try {
    const func = await asyncGetFunction(getFunctionParams);
    const { Location } = func.Code;
    await addLambdaFolderToCwd(lambdaName, Location);
    bamSpinner.stop();
    bamLog(`Folder: "${lambdaName}" is now in your current directory`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
