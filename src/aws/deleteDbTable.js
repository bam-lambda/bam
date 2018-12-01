const AWS = require('aws-sdk');
const { promisify } = require('util');

const getRegion = require('../util/getRegion');

module.exports = async function deleteTable(tableName) {
  const region = await getRegion();
  const apiVersion = 'latest';
  const dynamo = new AWS.DynamoDB({ apiVersion, region });

  const asyncDeleteTable = promisify(dynamo.deleteTable.bind(dynamo));
  await asyncDeleteTable({ TableName: tableName });
};
