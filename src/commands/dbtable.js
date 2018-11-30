const { bamError, bamLog } = require('../util/logger');
const createDbTable = require('../aws/createDbTable');
const bamSpinner = require('../util/spinner');
const getDbConfigFromUser = require('../util/getDbConfigFromUser');
const { readFile, writeFile } = require('../util/fileUtils');

module.exports = async function dbtable(tableName, path) {
  try {
    const dbConfig = await getDbConfigFromUser(tableName);
    if (dbConfig) {
      const tableConfigJSON = await readFile(`${path}/.bam/dbTables.json`, 'utf8');
      const tableConfig = JSON.parse(tableConfigJSON);
      tableConfig.tableName = dbConfig;
      await writeFile(`${path}/.bam/dbTables.json`, JSON.stringify(tableConfig, null, 2));
      const { partitionKey, sortKey } = dbConfig;
      bamSpinner.start();
      await createDbTable(tableName, partitionKey, sortKey);
      bamSpinner.stop();
      bamLog(`BAM received confirmation that AWS is creating DynamoDB "${tableName}" table`);
    }
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
