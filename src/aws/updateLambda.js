// var params = {
//   FunctionName: 'STRING_VALUE', /* required */
//   DryRun: true || false,
//   Publish: true || false,
//   RevisionId: 'STRING_VALUE',
//   S3Bucket: 'STRING_VALUE',
//   S3Key: 'STRING_VALUE',
//   S3ObjectVersion: 'STRING_VALUE',
//   ZipFile: new Buffer('...') || 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */
// };
// lambda.updateFunctionCode(params, function(err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
// });

const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const createDirectory = require('../util/createDirectory');
const zipper = require('../util/zipper.js');
const installLambdaDependencies = require('../util/installLambdaDependencies.js');
const bamBam = require('../util/bamBam.js');
const {
  bamLog,
  bamWarn,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

const apiVersion = 'latest';

module.exports = async function updateLambda(lambdaName, path) {
  const config = JSON.parse(fs.readFileSync(`${path}/.bam/config.json`));
  const { accountNumber, region, role } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaUpdateFunctionCode = promisify(lambda.updateFunctionCode.bind(lambda));

  const createTempDeployPkg = () => {
    const cwd = process.cwd();
    createDirectory(`${lambdaName}-temp`, `${path}/.bam/functions`);
    fs.copyFileSync(`${cwd}/${lambdaName}.js`, `${path}/.bam/functions/${lambdaName}-temp/index.js`);
  };

  const spinnerInterval = bamSpinner();
  createTempDeployPkg();
  await installLambdaDependencies(`${lambdaName}-temp`, path);
  //const zippedFileName = await zipper(`${lambdaName}-temp`, path);
  const zippedFileName = await zipper(lambdaName, path, `${lambdaName}-temp`);
  const zipContents = fs.readFileSync(zippedFileName);

  const updateAwsLambda = async () => {
    const params = {
      FunctionName: lambdaName,
      ZipFile: zipContents,
    };
    return bamBam(asyncLambdaUpdateFunctionCode, params);
  };

  const data = await updateAwsLambda();
  clearInterval(spinnerInterval);
  spinnerCleanup(); 
  return data;

//  if (data) {
//    await writeToLib(data);
//    clearInterval(spinnerInterval);
//    spinnerCleanup();
//    bamLog(`Lambda "${lambdaName}" has been created`);
//  } else {
//    clearInterval(spinnerInterval);
//    spinnerCleanup();
//    bamWarn(`Lambda "${lambdaName}" already exists`);
//  }
};
