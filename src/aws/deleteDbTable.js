const { asyncDeleteTable } = require('./awsFunctions');

module.exports = async function deleteTable(tableName) {
  await asyncDeleteTable({ TableName: tableName });
};
