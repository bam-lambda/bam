const { bamError, bamWarn } = require('../util/logger');
const createDbTable = require('../aws/createDbTable');
const getDbConfigFromUser = require('../util/getDbConfigFromUser');
const { readFile, writeFile } = require('../util/fileUtils');
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
};
