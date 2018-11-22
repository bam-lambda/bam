const { promisify } = require('util');
const https = require('https');
const exec = promisify(require('child_process').exec);
const AWS = require('aws-sdk');
const fs = require('fs');

const {
  bamLog,
  bamWarn,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText');
const { doesLambdaExist } = require('../aws/doesResourceExist');
const { readConfig, writeFile, readFile } = require('../util/fileUtils');

const apiVersion = 'latest';
const cwd = process.cwd();
const blankLambdaNameMsg = 'Lambda name must not be blank';
const lambdaDoesNotExistMsg = lambdaName => `Lambda "${lambdaName}" does not exist on AWS`;
const isEmptyStr = str => str === undefined || str.trim() === '';

const asyncHttpsGet = endpoint => (
  new Promise((resolve) => {
    https.get(endpoint, resolve);
  })
);

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
      // const funcZip = await asyncHttpsGet(Location);
const file = fs.createWriteStream(`${lambdaName}.zip`);
const request = https.get(Location, function(response) {
  response.pipe(file);
});
// await doing above & then unzip
      // exec(`unzip ${cwd}/${lambdaName}.zip`, { cwd });

      clearInterval(spinnerInterval);
      spinnerCleanup();
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
