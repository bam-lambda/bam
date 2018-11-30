const AWS = require('aws-sdk');
const { promisify } = require('util');
const { bamError } = require('../util/logger');

const getRegion = require('../util/getRegion');

const apiVersion = 'latest';

module.exports = async function createDbTable(tableName, partitionKey, sortKey) {
  const region = await getRegion();
  const dynamo = new AWS.DynamoDB({ apiVersion, region });
  const asyncCreateTable = promisify(dynamo.createTable.bind(dynamo));

  const provisionedThroughput = {
    ReadCapacityUnits: 100,
    WriteCapacityUnits: 10,
  };

  const keySchema = [
    {
      AttributeName: partitionKey.name,
      KeyType: 'HASH',
    },
  ];

  const attributeDefinitions = [
    {
      AttributeName: partitionKey.name,
      AttributeType: partitionKey.dataType,
    },
  ];

  if (sortKey) {
    const sortKeySchema = {
      AttributeName: sortKey.name,
      AttributeType: sortKey.dataType,
    };

    const sortKeyAttributeDefinition = {
      AttributeName: sortKey.name,
      KeyType: 'RANGE',
    };

    keySchema.push(sortKeySchema);
    attributeDefinitions.push(sortKeyAttributeDefinition);
  }

  const tableParams = {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    ProvisionedThroughput: provisionedThroughput,
  };

  try {
    await asyncCreateTable(tableParams);
  } catch (err) {
    bamError(err);
  }
};
