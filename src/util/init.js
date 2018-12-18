const setupBamDirAndFiles = require('./setupBamDirAndFiles');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');
const { doesRoleExist } = require('../aws/doesResourceExist');

const databaseBamRole = 'databaseBamRole';

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  await createBamRole(roleName);
  const isInitialized = await doesRoleExist(roleName);
  await createDatabaseBamRole(databaseBamRole, path);
  return !!isInitialized;
};
