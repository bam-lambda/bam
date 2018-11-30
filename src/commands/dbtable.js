const { bamError, bamLog } = require('../util/logger');
const createDbTable = require('../aws/createDbTable');
const bamSpinner = require('../util/spinner');

module.exports = async function dbtable(tableName) {
  bamSpinner.start();

  try {
    await getDbConfigFromUser();
    const dbTableLibrary = readFile();
    const partitionKey = dbTableLibrary[tableName].partitionKey;
    const sortKey = dbTableLibrary[tableName].sortKey;
    await createDbTable(tableName, partitionKey, sortKey);
    bamSpinner.stop();
    bamLog(`DynamoDB table "${tableName}" is being created. This may take a few minutes to complete on AWS.`);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
