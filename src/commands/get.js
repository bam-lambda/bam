const { promisify } = require('util');
const https = require('https');
const AWS = require('aws-sdk');
const stream = require('stream');

const finished = promisify(stream.finished);

const {
  bamLog,
  bamWarn,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText');

const { unzipper } = require('../util/zipper');
const { doesLambdaExist } = require('../aws/doesResourceExist');
const {
  readConfig,
  createWriteStream,
  createDirectory,
  promisifiedRimraf,
} = require('../util/fileUtils');

const apiVersion = 'latest';
const cwd = process.cwd();
const blankLambdaNameMsg = 'Lambda name must not be blank';
const lambdaDoesNotExistMsg = lambdaName => `Lambda "${lambdaName}" does not exist on AWS`;
const isEmptyStr = str => str === undefined || str.trim() === '';

const addLambdaFileToCwd = async (lambdaName, location) => {
  const zipFileName = `${lambdaName}.zip`;
  await createDirectory(lambdaName, cwd);
  const file = createWriteStream(`${lambdaName}/${zipFileName}`);
  return new Promise((res) => {
    https.get(location, async (response) => {
      response.pipe(file);
      finished(file, async () => {
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
  const lambdaExists = doesLambdaExist(lambdaName);

  if (isEmptyStr(lambdaName)) {
    clearInterval(spinnerInterval);
    spinnerCleanup();
    bamWarn(blankLambdaNameMsg);
  } else if (!(await lambdaExists)) {
    clearInterval(spinnerInterval);
    spinnerCleanup();
    bamWarn(lambdaDoesNotExistMsg(lambdaName));
  } else {
    const config = await readConfig(path);
    const { region } = config;

    const lambda = new AWS.Lambda({ apiVersion, region });
    const getFunctionParams = { FunctionName: lambdaName };
    const getLambdaFunction = promisify(lambda.getFunction.bind(lambda));

    try {
      const func = await getLambdaFunction(getFunctionParams);
      const { Location } = func.Code;
      await addLambdaFileToCwd(lambdaName, Location);
      clearInterval(spinnerInterval);
      spinnerCleanup();
      bamLog(`File: "${lambdaName}".js is now in your current directory`);
    } catch (err) {
      clearInterval(spinnerInterval);
      spinnerCleanup();
      bamError(err);
    }
    // pull lambda code
    // create .js file w/ lambda code
    // make sure there is not currently a file by that name
    // add to cwd
  }

  // clearInterval(spinnerInterval);
  // spinnerCleanup();
};
