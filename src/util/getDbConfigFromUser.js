const getUserInput = require('./getUserInput');

const validPrimaryKeyName = (r) => /^.{1,255}$/.test(r);
const validPrimaryKeyDataType = (dataType) =>
  ['string', 'number', 'binary'].includes(dataType);

const badPrimaryKeyName = 'Key name must be between 1 and 255 characters';
const badPrimaryKeyDataType =
  'Key data type must be "string", "number", or "binary"';

const awsDataTypes = {
  string: 'S',
  number: 'N',
  binary: 'B',
};

module.exports = async function getDbConfigFromUser(tableName) {
  const getPartitionKeyName = {
    question: `Please provide a partition key for "${tableName}": `,
    validator: validPrimaryKeyName,
    feedback: badPrimaryKeyName,
    defaultAnswer: 'id',
  };

  const getPartitionKeyDataType = {
    question:
      'Please provide the data type of the partition key (string | number | binary): ',
    validator: validPrimaryKeyDataType,
    feedback: badPrimaryKeyDataType,
    defaultAnswer: 'number',
  };

  const getSortKeyName = {
    question: `Please provide a sort key for "${tableName}": `,
    validator: validPrimaryKeyName,
    feedback: badPrimaryKeyName,
    defaultAnswer: 'none',
  };

  const getSortKeyDataType = {
    question:
      'Please provide the data type of the sort key (string | number | binary): ',
    validator: validPrimaryKeyDataType,
    feedback: badPrimaryKeyDataType,
    defaultAnswer: '',
  };

  const configPrompts = [
    getPartitionKeyName,
    getPartitionKeyDataType,
    getSortKeyName,
  ];

  const userResponses = await getUserInput(configPrompts); // undefined if user quits prompts
  if (!userResponses) return false;

  const [
    partitionKeyName,
    partitionKeyDataTypeString,
    sortKeyName,
  ] = userResponses;
  const partitionKeyDataType = awsDataTypes[partitionKeyDataTypeString];
  const userConfig = {
    partitionKey: {
      name: partitionKeyName,
      dataType: partitionKeyDataType,
    },
  };

  if (sortKeyName !== 'none') {
    const [additionalResponse] = await getUserInput([getSortKeyDataType]);
    if (!additionalResponse) return false;

    const sortKeyDataType = awsDataTypes[additionalResponse];
    userConfig.sortKey = {
      name: sortKeyName,
      dataType: sortKeyDataType,
    };
  }

  return userConfig;
};
