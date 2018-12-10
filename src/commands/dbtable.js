const createDbTable = require('../aws/createDbTable');
const { bamError, bamWarn } = require('../util/logger');
const getDbConfigFromUser = require('../util/getDbConfigFromUser');
const { writeDbtable } = require('../util/fileUtils');
const { validateTableCreation } = require('../util/validations');

module.exports = async function dbtable(tableName, path) {
  const invalidTableMsg = await validateTableCreation(tableName);
  if (invalidTableMsg) {
    bamWarn(invalidTableMsg);
    return;
  }

  try {
    const dbConfig = await getDbConfigFromUser(tableName);
    if (dbConfig) {
      await writeDbtable(tableName, dbConfig, path);
      const { partitionKey, sortKey } = dbConfig;
      await createDbTable(tableName, partitionKey, sortKey);
    }
  } catch (err) {
    bamError(err);
  }
};
