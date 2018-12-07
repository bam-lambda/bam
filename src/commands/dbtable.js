const { bamError, bamWarn, bamLog } = require('../util/logger');
const createDbTable = require('../aws/createDbTable');
const deleteDbTable = require('../aws/deleteDbTable');
const getDbConfigFromUser = require('../util/getDbConfigFromUser');
const { deleteTableFromLibrary, writeDbtable } = require('../util/fileUtils');
const { validateTableCreation } = require('../util/validations');
const { doesTableExist } = require('../aws/doesResourceExist');

module.exports = async function dbtable(tableName, path, options) {
  if (options.delete) {
    const tableExists = await doesTableExist(tableName);
    if (tableExists) {
      await deleteDbTable(tableName);
      await deleteTableFromLibrary(tableName, path);
      bamLog(`"${tableName}" table has been deleted`);
    } else {
      bamWarn(`"${tableName}" table does not exist on AWS`);
    }
  } else {
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
  }
};
