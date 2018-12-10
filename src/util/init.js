const setupBamDirAndFiles = require('./setupBamDirAndFiles');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');

const databaseBamRole = 'databaseBamRole';

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  const isInitialized = await createBamRole(roleName);
  await createDatabaseBamRole(databaseBamRole, path);
  return !!isInitialized;
};
