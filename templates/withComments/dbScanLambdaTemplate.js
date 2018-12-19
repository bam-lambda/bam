// Welcome to your BAM! lambda!

// IMPORTANT!! to interact with DynamoDB, your lambda must have permissions
// if you aren't using a custom role, be sure to deploy this lambda
// using the --permitDb flag to ensure it has appropriate permissions

const { promisify } = require('util');
const AWS = require('aws-sdk');
// all require statements for npm packages go here above this line

// TODO: describe your lambda below:
// description:

// handler is the name of the function being exported; it's best to leave as the default
exports.handler = async (event) => {
  const region = 'userRegion';
  const docClient = new AWS.DynamoDB.DocumentClient({ region });
  const asyncScan = promisify(docClient.scan.bind(docClient));

  const { pathParameters, queryStringParameters, httpMethod } = event;

  // pathParameters will contain a property called "proxy" if path params were used
  const pathParams = pathParameters ? pathParameters.proxy : '';

  // example use of queryStringParameters to obtain value for "name" parameter
  // const name = queryStringParameters ? queryStringParameters.name : 'no name'

  const scanParameters = {
    // TODO: change the name of your table
    TableName: 'myTable',
    // the maximum number of records to return
    Limit: 100,
  };

  const paragraphize = arr => (
    arr.reduce((itemsArr, item) => {
      const keys = Object.keys(item);
      const paragraphs = keys.map(key => `<p>${key}: ${item[key]}</p>`).join('\n');
      return itemsArr.concat([paragraphs]);
    }, []).join('\n')
  );

  // the data returned from a successful SCAN operation
  const data = await asyncScan(scanParameters);
  // convert returned data into paragraph elements
  const items = paragraphize(data.Items);
  const response = {};

  // it's only necessary to handle the methods you have created
  // for this API Gateway endpoint (default is GET),
  // but this is an example of how to handle
  // the response for multiple methods
  if (httpMethod === 'GET') {
    // return value must be proper http response
    response.statusCode = 200;
    // content-type headers should be set to text/html
    response.headers = { 'content-type': 'text/html' };
    // what the page will show
    const html = items;
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
