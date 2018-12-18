// description:

const AWS = require('aws-sdk');
const { promisify } = require('util');

exports.handler = async (event) => {
  // TODO: replace 'user-region' with your AWS region
  AWS.config.region = 'user-region';
  const lambda = new AWS.Lambda();
  const asyncInvokeLambda = promisify(lambda.invoke.bind(lambda));

  const { pathParameters, queryStringParameters, httpMethod } = event;
  const pathParams = pathParameters ? pathParameters.proxy : '';

  const params = {
    FunctionName: '',
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: '{}',
  };

  const data = await asyncInvokeLambda(params);
  const payloadFromInvokedLambda = JSON.parse(data.Payload);
  const html = payloadFromInvokedLambda;

  const response = {};

  if (httpMethod === 'GET') {
    response.statusCode = 200;
    response.headers = { 'content-type': 'text/html' };
    response.body = html;
  } else if (httpMethod === 'POST') {
    response.statusCode = 201;
  } else if (httpMethod === 'DELETE') {
    response.statusCode = 204;
  } else if (httpMethod === 'PUT') {
    response.statusCode = 204;
  } else if (httpMethod === 'PATCH') {
    response.statusCode = 204;
  }

  return response;
};
