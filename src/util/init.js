const getUserDefaults = require('./getUserDefaults');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');
const setupBamDirAndFiles = require('./setupBamDirAndFiles');

const databaseBamRole = 'databaseBamRole';

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  const isInitialized = await getUserDefaults(path);
  await createBamRole(roleName);
  await createDatabaseBamRole(databaseBamRole, path);
  return !!isInitialized;
};
