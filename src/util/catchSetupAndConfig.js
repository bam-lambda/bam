const getUserDefaults = require('./getUserDefaults');
const init = require('./init');
const { getRegion } = require('./getRegion');
const { createBamRole, createDatabaseBamRole } = require('../aws/createRoles');
const { doesRoleExist } = require('../aws/doesResourceExist');

const {
  msgAfterAction,
  log,
  bamLog,
  bamWarn,
} = require('./logger');

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
  if (commandIsNotValid(command) || ['help', 'version', 'create'].includes(command)) return true;

  const awsConfigExistsWithRegionSet = getRegion();
  if (!awsConfigExistsWithRegionSet) {
    bamWarn('AWS credentials have not been set up.  For instructions, please visit:');
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
    bamWarn('BAM! configuration setup is incomplete');
    const nowConfigured = await getUserDefaults(path);
    if (!nowConfigured) return false;
    bamLog('BAM! configuration completed successfully');
  }

  const config = await readConfig(path);
  if (config.role === bamRole) {
    await createBamRole(bamRole);
  } else {
    const doesConfigRoleExists = await doesRoleExist(config.role);
    if (!doesConfigRoleExists) {
      bamWarn(msgAfterAction('role', config.role, 'exist', 'does not'));
      return false;
    }
  }

  await createDatabaseBamRole(databaseBamRole, path);

  return true;
};
