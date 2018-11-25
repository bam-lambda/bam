const { promisify } = require('util');
const https = require('https');
const AWS = require('aws-sdk');

const {
  bamLog,
  bamWarn,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText');

const {
  readConfig,
  createWriteStream,
  createDirectory,
  promisifiedRimraf,
  readdir,
} = require('../util/fileUtils');

const { unzipper } = require('../util/zipper');
const { doesLambdaExist } = require('../aws/doesResourceExist');

const apiVersion = 'latest';
const cwd = process.cwd();
const blankLambdaNameMsg = 'Lambda name must not be blank';
const lambdaDoesNotExistMsg = lambdaName => `Lambda "${lambdaName}" does not exist on AWS`;
const lambdaExistsMsg = lambdaName => `A directory or file matching "${lambdaName}" already exists in this directory`;
const isEmptyStr = str => str === undefined || str.trim() === '';

const lambdaNameExistsInCwd = async (lambdaName) => {
  const files = await readdir(cwd);
  return files.some((file) => {
    const fileWithoutExtension = file.split('.')[0];
    return fileWithoutExtension === lambdaName;
  });
};

const addLambdaFileToCwd = async (lambdaName, location) => {
  const zipFileName = `${lambdaName}.zip`;
  await createDirectory(lambdaName, cwd);
  const file = createWriteStream(`${lambdaName}/${zipFileName}`);
  return new Promise((res) => {
    https.get(location, async (response) => {
      response.pipe(file);
      file.on('finish', async () => {
        await unzipper(lambdaName);
        await promisifiedRimraf(`${lambdaName}`);
        res();
      });
    });
  });
};

// path only needed for aws func -> remove when that is extracted
module.exports = async function get(lambdaName, path) {
  const spinnerInterval = bamSpinner();
  const lambdaExistsOnAws = doesLambdaExist(lambdaName);
  const lambdaNameExistsLocally = lambdaNameExistsInCwd(lambdaName);
  let warn = true;
  let msg;

  if (isEmptyStr(lambdaName)) {
    msg = blankLambdaNameMsg;
  } else if (await lambdaNameExistsLocally) {
    msg = lambdaExistsMsg(lambdaName);
  } else if (!(await lambdaExistsOnAws)) {
    msg = lambdaDoesNotExistMsg(lambdaName);
  } else {
    warn = false;
    const config = await readConfig(path);
    const { region } = config;

    const lambda = new AWS.Lambda({ apiVersion, region });
    const getFunctionParams = { FunctionName: lambdaName };
    const getLambdaFunction = promisify(lambda.getFunction.bind(lambda));

    try {
      const func = await getLambdaFunction(getFunctionParams);
      const { Location } = func.Code;
      await addLambdaFileToCwd(lambdaName, Location);
      msg = `File: "${lambdaName}".js is now in your current directory`;
    } catch (err) {
      clearInterval(spinnerInterval);
      spinnerCleanup();
      bamError(err);
      return;
    }
  }

  clearInterval(spinnerInterval);
  spinnerCleanup();

  if (warn) {
    bamWarn(msg);
  } else {
    bamLog(msg);
  }
};
