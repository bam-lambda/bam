const getUserDefaults = require('./getUserDefaults');
const createRole = require('../aws/createRole');
const setupBamDirAndFiles = require('./setupBamDirAndFiles');

module.exports = async function init(roleName, path) {
  await setupBamDirAndFiles(roleName, path);
  await getUserDefaults(path);
  await createRole(roleName, path);
};
