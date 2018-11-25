const getUserDefaults = require('./getUserDefaults');
const createRole = require('../aws/createRole');
const setupBamDirAndFiles = require('./setupBamDirAndFiles');

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  const isInitialized = await getUserDefaults(path);
  await createRole(roleName, path);
  return !!isInitialized;
};
