const getUserDefaults = require('./getUserDefaults.js');
const init = require('./init.js');
const { bamLog, bamWarn } = require('./fancyText.js');
const { exists, isConfigured } = require('./fileUtils.js');
const defaultRole = 'bamRole';

module.exports = async function catchSetupAndConfig(path, command) {
  if (!['create', 'deploy', 'redeploy', 'list', 'get', 'config'].includes(command)) return true;
  const bamDirExists = await exists(`${path}/.bam`);
  if (!bamDirExists) {
    const isInitialized = await init(defaultRole, path);
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
  return true;
};