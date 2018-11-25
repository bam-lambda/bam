const getUserDefaults = require('./getUserDefaults.js');
const createRole = require('../aws/createRole.js');
const setupBamDirAndFiles = require('./setupBamDirAndFiles.js');

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  const isInitialized = await getUserDefaults(path);
  await createRole(roleName, path);
  return !!isInitialized;
};
