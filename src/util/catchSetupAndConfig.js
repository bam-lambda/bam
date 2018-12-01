const getUserDefaults = require('./getUserDefaults.js');
const init = require('./init.js');
const { bamLog, bamWarn } = require('./fancyText.js');
const { readConfig, exists, isConfigured } = require('./fileUtils.js');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');
const { doesRoleExist } = require('../aws/doesResourceExist');

const bamRole = 'bamRole';
const databaseBamRole = 'databaseBamRole';

module.exports = async function catchSetupAndConfig(path, command, options) {
  if (!['create', 'deploy', 'redeploy', 'list', 'get', 'delete', 'config', 'dbtable']
    .includes(command)) return true;

  const bamDirExists = await exists(`${path}/.bam`);
  if (!bamDirExists) {
    const isInitialized = await init(bamRole, path);
    // don't continue if init incomplete, don't config twice
    if (!isInitialized || command === 'config') return false;
  }

  const configured = await isConfigured(path);
  // don't continue if configuration incomplete
  if (!configured) {
    bamWarn('Your configuration setup is incomplete');
    const nowConfigured = await getUserDefaults(path);
    if (!nowConfigured) return false;
    bamLog('Configuration completed successfully!');
  }

  const config = await readConfig(path);
  if (config.role === bamRole) {
    await createBamRole(bamRole);
  } else {
    const doesConfigRoleExists = await doesRoleExist(config.role);
    if (!doesConfigRoleExists) {
      bamWarn(`${config.role} does not exist.`);
      return false;
    }
  }

  if ((command === 'deploy' || command === 'redeploy') && options.permitDb) {
    await createDatabaseBamRole(databaseBamRole, path);
  }

  return true;
};
