// Welcome to your BAM! lambda!

// TODO: describe your lambda below:
// description:

// IMPORTANT!! to interact with DynamoDB, your lambda must have permissions
// if you aren't using a custom role, be sure to deploy this lambda
// using the --permitDb flag to ensure it has appropriate permissions

const { promisify } = require('util');
const AWS = require('aws-sdk');
// all require statements for npm packages should be above this line

// handler is the name of the function being exported; it's best to leave as the default
exports.handler = async (event) => {
  const region = 'userRegion';
  const docClient = new AWS.DynamoDB.DocumentClient({ region });
  const asyncDelete = promisify(docClient.delete.bind(docClient));
  const asyncScan = promisify(docClient.scan.bind(docClient));
  const asyncPut = promisify(docClient.put.bind(docClient));
  const asyncGet = promisify(docClient.get.bind(docClient));

  const { pathParameters, queryStringParameters, httpMethod } = event;

  // pathParameters will contain a property called "proxy" if path params were used
  const pathParams = pathParameters ? pathParameters.proxy : '';

  // example use of queryStringParameters to obtain value for "name" parameter
  // const name = queryStringParameters ? queryStringParameters.name : 'no name';

  const paragraphize = arr => (
    arr.reduce((itemsArr, item) => {
      const keys = Object.keys(item);
      const paragraphs = keys.map(key => `<p>${key}: ${item[key]}</p>`).join('\n');
      return itemsArr.concat([paragraphs]);
    }, []).join('\n')
  );

  const deleteParams = {
    // TODO: replace "myTable" with the name of your table
    TableName: 'myTable',
    Key: {
      // TODO: replace "attributeName" with the name of the table's partition key
      // and replace "value" with the value of the partition key
      attributeName: 'value',
    },
  };

  const scanParameters = {
    // TODO: replace "myTable" with the name of your table
    TableName: 'myTable',
    // the maximum number of records to return
    Limit: 100,
  };

  const getParams = {
    // TODO: replace "myTable" with the name of your table
    TableName: 'myTable',
    Key: {
      // TODO: replace "attributeName" with the name of the table's partition key
      // and replace "value" with the value of the partition key
      attributeName: 'value',
    },
  };

  const putParams = {
    Item: {
      // partition key attribute
      // this is the only required attribute
      // replace "id" with the name of the key you are adding
      // data type of value must be string, number, boolean, null, array, object
      // "str" | 10 | true | false | null | [1, "a"] | {a: "b"}
      id: 1,
      // second attribute (only the partition key attribute is required)
      // replace "attribute2" with the name of the key you are adding
      attribute2: 'a string',
      // third attribute (only the partition key attribute is required)
      // replace "attribute3" with the name of the key you are adding
      attribute3: true,
    },
    // TODO: replace "myTable" with the name of your table
    TableName: 'myTable',
  };

  // PUT record
  await asyncPut(putParams);
  // GET record
  const getData = await asyncGet(getParams);
  // convert returned data into a paragraph element
  const item = paragraphize([getData.Item]);
  // the data returned from a successful SCAN operation
  const scanData = await asyncScan(scanParameters);
  // convert returned data into paragraph elements
  const items = paragraphize(scanData.Items);
  // DELETE record
  await asyncDelete(deleteParams);

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
    const html = `<h1>items</h1>${items}<h2>item</h2>${item}`;
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
