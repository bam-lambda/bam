const fs = require('fs');
const AWS = require('aws-sdk');
const zipper = require('./zipper.js');
const { promisify } = require('util');

const apiVersion = 'latest';

const fileName = 'index.js';


module.exports = async (lambdaName, description, src) => {
  const config = JSON.parse(fs.readFileSync('./bam/config.json'));
  const region = config.region;
  const accountNumber = config.accountNumber;
  const role = config.role;

  const lambda = new AWS.Lambda({ apiVersion, region });

  const zippedFileName = await zipper(lambdaName, src);
  const zipContents = fs.readFileSync(`${src}/bam/functions/${lambdaName}/${lambdaName}.zip`);

  const deployLambda = async () => {    
    const params = {
      Code: { 
        ZipFile: zipContents
      },
      FunctionName: lambdaName,
      Handler: `index.handler`,
      Role: `arn:aws:iam::${accountNumber}:role/${role}`,
      Runtime: 'nodejs8.10',
      Description: description
    };

    const asyncLambdaCreateFunction = promisify(lambda.createFunction.bind(lambda, params));

    try {      
      return await asyncLambdaCreateFunction();
    } catch (err) {
      console.log(err, err.stack);
      return null;
    }
  };
 
  const writeToLib = (data) => {
    if (!data) return null;
    const name = data.FunctionName;
    const arn = data.FunctionArn;
    const description = data.Description;

    // read contents from library
    const functions = JSON.parse(fs.readFileSync(`${src}/bam/functions/library.json`));
    functions[name] = { arn, description };

    // write back to library
    fs.writeFileSync(`${src}/bam/functions/library.json`, JSON.stringify(functions));
    console.log(`${lambdaName} has been deployed. Check out ${src}/bam/functions/library.json`);
  }
 
  const data = await deployLambda();
  await writeToLib(data);
};


