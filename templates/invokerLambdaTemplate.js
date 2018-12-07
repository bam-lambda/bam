var AWS = require('aws-sdk');
AWS.config.region = 'UserRegion';
var lambda = new AWS.Lambda();

const { promisify } = require('util');
const asyncInvokeLambda = promisify(lambda.invoke.bind(lambda));

// handler is the name of the function being exported; it's best to leave as the default.
exports.handler = async (event) => {
  // setup code
  const { httpMethod, queryStringParameters } = event;
  let params = {
    FunctionName: '', // name of the lambda this function will invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{}' // stringified object whose properties will be assigned to event object received by invoked lambda
  };

  // invoke other lambda
  const data = await asyncInvokeLambda(params); // response of invoked lambda appears is the string data.Payload
  const payload = JSON.parse(data.Payload);

  // what the page will show
  const html = '';

  // DO NOT DELETE
  // return value must be proper http response with content-type set to text/html
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: html,
  };
};
