const fs = require('fs');
const AWS = require('aws-sdk');
const zipper = require('./zipper.js');

const apiVersion = 'latest';
const lambda = new AWS.Lambda({ apiVersion });
AWS.config.update({ region });
const fileName = 'index.js';
const zippedFileName = `${lambdaName}.zip`;

module.exports = (lambdaName, src) => {
  fs.readFileSync(`${src}/bam/functions/${lambdaName}/index.js`);
  // prompt user for decription
  // zip lambda
  // deploy function
  // grab arn
  // write arn to & description to library.json file
  /// zipper(lambaName)

  // pull in config for:
  //  region
  //  accountId
  //  role

  const deployLambda = async (zipfile) => {
    const params = {
      Code: { // required
      // could use S3 bucket instead of ZipFile
        ZipFile: zipfile
      },
      FunctionName: functionName, // required
      Handler: `${functionName}.handler`, // required
      Role: `arn:aws:iam::${accountNumber}:role/${role}`, // required
      Runtime: 'nodejs8.10', // required
      Description: 'a test'
    };
    // only necesary because there's an async call in getDeployParams
    // for other aws-sdk function calls, params would just be specified here
    // const params = await getDeployParams();
    // const params = await getDeployParams();
    // promisify while binding this to the function with the params
    const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda, params));
    // async function is called w/in promiseTryCatch which will wait for it to
    // complete & then log results
    await promiseTryCatch(asyncLambdaCreateFunction);
  };

  console.log(`${lambdaName} has been deployed`);
};


