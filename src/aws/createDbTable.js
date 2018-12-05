const { bamError, bamLog } = require('../util/logger');
const bamSpinner = require('../util/spinner');
const { asyncCreateTable } = require('./awsFunctions');

module.exports = async function createDbTable(tableName, partitionKey, sortKey) {
  bamSpinner.start();

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
      KeyType: 'RANGE',
    };

    const sortKeyAttributeDefinition = {
      AttributeName: sortKey.name,
      AttributeType: sortKey.dataType,
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
    bamSpinner.stop();
    bamLog(`BAM received confirmation that AWS is creating DynamoDB "${tableName}" table`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
    return err;
  }
};
