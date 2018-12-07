var AWS = require('aws-sdk');
AWS.config.region = 'UserRegion';
var lambda = new AWS.Lambda();

const { promisify } = require('util');
const asyncInvokeLambda = promisify(lambda.invoke.bind(lambda));

// handler is the name of the function being exported; it's best to leave as the default.
exports.handler = async (event) => {
  const fs = require('fs');
  const { promisify } = require('util');

  const { httpMethod, queryStringParameters } = event;

  // invoke another lambda

  let params = {
    FunctionName: '', // name of the lambda this function will invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{}' // stringified object whose properties will be assigned to event object received by invoked lambda
  };

  const data = await asyncInvokeLambda(params); // response of invoked lambda appears is the string data.Payload
  const payload = JSON.parse(data.Payload);


  // bring in data from your database

  if (httpMethod === 'GET') {
    // root directory of lambda function on AWS
    const rootDir = process.env.LAMBDA_TASK_ROOT;
    const readFile = promisify(fs.readFile);

    // add index.html to your lambda folder
    let html = await readFile(`${rootDir}/index.html`, 'utf8');
    // add main.css to your lambda folder
    const css = await readFile(`${rootDir}/main.css`, 'utf8');

    const replacePlaceHolder = (nameOfPlaceHolder, newText) => {
      html = html.replace(nameOfPlaceHolder, newText);
    };

    // since there is no DOM, there should be an empty style tag in your html
    // file that you fill with the contents of your css file
    replacePlaceHolder('<style></style>', `<style>${css}</style>`);
    replacePlaceHolder('Placeholder', 'data from your database');

    // DO NOT DELETE
    // return value must be proper http response
    // with content-type set to text/html
    // ''
    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: html,
    };
  }
};
