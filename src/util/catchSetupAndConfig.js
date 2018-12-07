const getUserDefaults = require('./getUserDefaults');
const init = require('./init');
const { log, bamLog, bamWarn } = require('./logger');
const { getRegion } = require('./getRegion');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');
const { doesRoleExist } = require('../aws/doesResourceExist');

const {
  readConfig,
  exists,
  isConfigured,
  getBamPath,
} = require('./fileUtils');

const bamRole = 'bamRole';
const databaseBamRole = 'databaseBamRole';
const commands = [
  'create',
  'deploy',
  'redeploy',
  'list',
  'get',
  'delete',
  'config',
  'dbtable',
  'help',
  'version',
];
const commandIsNotValid = command => !commands.includes(command);

module.exports = async function catchSetupAndConfig(path, command, options) {
  if (commandIsNotValid(command) || ['help', 'version'].includes(command)) return true;

  const awsConfigExistsWithRegionSet = getRegion();
  if (!awsConfigExistsWithRegionSet) {
    bamWarn('You have not set up your AWS credentials.  For instructions, please visit:');
    log('https://docs.aws.amazon.com/cli/latest/topic/config-vars.html');
    return false;
  }

  const bamPath = getBamPath(path);
  const bamDirExists = await exists(bamPath);
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
