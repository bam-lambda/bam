const getUserDefaults = require('./getUserDefaults');
const createRoles = require('../aws/createRoles');
const setupBamDirAndFiles = require('./setupBamDirAndFiles');

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  const isInitialized = await getUserDefaults(path);
  await createRoles(roleName, path);
  return !!isInitialized;
};
