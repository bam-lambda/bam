const deploy = require('./deploy');
const redeploy = require('./redeploy');
const create = require('./create');
const get = require('./get');
const list = require('./list');
const version = require('./version');
const destroy = require('./destroy');
const dbtable = require('./dbtable');
const help = require('./help');
const config = require('./config');

const { bamWarn } = require('../util/logger');

const commandIsBlank = (cmd) => cmd === undefined || cmd === '';
const commandIsHelp = (cmd) => cmd === 'help' || cmd === '-h' || cmd === 'man';

module.exports = async function executeCommand(
  command,
  resourceName,
  options,
  homedir,
) {
  if (command === 'create') {
    await create(resourceName, options);
  } else if (command === 'deploy') {
    await deploy(resourceName, homedir, options);
  } else if (command === 'redeploy') {
    await redeploy(resourceName, homedir, options);
  } else if (command === 'get') {
    await get(resourceName);
  } else if (command === 'delete') {
    await destroy(resourceName, homedir, options);
  } else if (command === 'dbtable') {
    await dbtable(resourceName, homedir);
  } else if (command === 'list') {
    await list(homedir, options);
  } else if (command === 'version' || command === '-v') {
    await version();
  } else if (commandIsHelp(command) || commandIsBlank(command)) {
    await help(options);
  } else if (command === 'config') {
    await config();
  } else {
    bamWarn(`Command: ${command} is not valid.`);
  }
};
