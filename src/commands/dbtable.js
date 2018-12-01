const { bamError, bamWarn, bamLog } = require('../util/logger');
const createDbTable = require('../aws/createDbTable');
const deleteDbTable = require('../aws/deleteDbTable');
const getDbConfigFromUser = require('../util/getDbConfigFromUser');
const { readFile, writeFile } = require('../util/fileUtils');
const { validateTableCreation } = require('../util/validations');
const { doesTableExist } = require('../aws/doesResourceExist');

module.exports = async function dbtable(tableName, path, options) {
  if (options.delete) {
    const tableExists = await doesTableExist(tableName);
    if (tableExists) {
      await deleteDbTable(tableName);
      const tableConfigJSON = await readFile(`${path}/.bam/dbTables.json`, 'utf8');
      const tableConfig = JSON.parse(tableConfigJSON);
      delete tableConfig[tableName];
      await writeFile(`${path}/.bam/dbTables.json`, JSON.stringify(tableConfig, null, 2));
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
        const tableConfigJSON = await readFile(`${path}/.bam/dbTables.json`, 'utf8');
        const tableConfig = JSON.parse(tableConfigJSON);
        tableConfig[tableName] = dbConfig;
        await writeFile(`${path}/.bam/dbTables.json`, JSON.stringify(tableConfig, null, 2));
        const { partitionKey, sortKey } = dbConfig;
        await createDbTable(tableName, partitionKey, sortKey);
      }
    } catch (err) {
      bamError(err);
    }
  }
};
