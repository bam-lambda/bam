const { promisify } = require('util');
const https = require('https');
const AWS = require('aws-sdk');

const {
  bamLog,
  bamWarn,
  bamError,
} = require('../util/logger');

const {
  readConfig,
  createWriteStream,
  createDirectory,
  unlink,
  rename,
} = require('../util/fileUtils');

const bamSpinner = require('../util/spinner');
const { unzipper } = require('../util/zipper');
const { validateLambdaRetrieval } = require('../util/validations');

const apiVersion = 'latest';
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

// path only needed for aws func -> remove when that is extracted
module.exports = async function get(lambdaName, path) {
  bamSpinner.start();
  const invalidLambdaMsg = await validateLambdaRetrieval(lambdaName);

  if (invalidLambdaMsg) {
    bamSpinner.stop();
    bamWarn(invalidLambdaMsg);
    return;
  }

  const config = await readConfig(path);
  const { region } = config;

  const lambda = new AWS.Lambda({ apiVersion, region });
  const getFunctionParams = { FunctionName: lambdaName };
  const getLambdaFunction = promisify(lambda.getFunction.bind(lambda));

  try {
    const func = await getLambdaFunction(getFunctionParams);
    const { Location } = func.Code;
    await addLambdaFolderToCwd(lambdaName, Location);
    bamSpinner.stop();
    bamLog(`Folder: "${lambdaName}" is now in your current directory`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
