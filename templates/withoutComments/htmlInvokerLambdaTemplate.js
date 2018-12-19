// description:

const AWS = require('aws-sdk');
const { promisify } = require('util');
const fs = require('fs');

exports.handler = async (event) => {
  const apiVersion = 'latest';
  const region = 'userRegion';
  const lambda = new AWS.Lambda({ apiVersion, region });
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

  const response = {};

  if (httpMethod === 'GET') {
    response.statusCode = 200;
    response.headers = { 'content-type': 'text/html' };

    const rootDir = process.env.LAMBDA_TASK_ROOT;
    const readFile = promisify(fs.readFile);
    let html = await readFile(`${rootDir}/index.html`, 'utf8');
    const css = await readFile(`${rootDir}/main.css`, 'utf8');

    const replacePlaceHolder = (nameOfPlaceHolder, newText, replaceAll = false) => {
      if (replaceAll) {
        const regex = new RegExp(nameOfPlaceHolder, 'g');
        html = html.replace(regex, newText);
      } else {
        html = html.replace(nameOfPlaceHolder, newText);
      }
    };

    replacePlaceHolder('<style></style>', `<style>${css}</style>`);
    replacePlaceHolder('Placeholder', payloadFromInvokedLambda);

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
