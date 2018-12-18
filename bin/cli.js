#!/usr/bin/env node
const os = require('os');

const deploy = require('../src/commands/deploy');
const redeploy = require('../src/commands/redeploy');
const create = require('../src/commands/create');
const get = require('../src/commands/get');
const list = require('../src/commands/list');
const version = require('../src/commands/version');
const destroy = require('../src/commands/destroy');
const dbtable = require('../src/commands/dbtable');
const help = require('../src/commands/help');
const config = require('../src/commands/config');
const handleArgs = require('../src/util/handleArgs');
const { bamWarn } = require('../src/util/logger');
const catchSetupAndConfig = require('../src/util/catchSetupAndConfig');

const [,, command, ...args] = process.argv;
const homedir = os.homedir();
const commandIsBlank = cmd => cmd === undefined || cmd === '';
const commandIsHelp = cmd => (
  cmd === 'help' || cmd === '-h' || cmd === 'man'
);

(async () => {
  let resourceName;
  let options = {};

  if (args) ({ resourceName, options } = handleArgs(args, command));
  const shouldContinue = await catchSetupAndConfig(homedir, command, options);
  if (!shouldContinue) return;

  if (command === 'create') {
    create(resourceName, options);
  } else if (command === 'deploy') {
    deploy(resourceName, homedir, options);
  } else if (command === 'redeploy') {
    redeploy(resourceName, homedir, options);
  } else if (command === 'get') {
    get(resourceName);
  } else if (command === 'delete') {
    destroy(resourceName, homedir, options);
  } else if (command === 'dbtable') {
    dbtable(resourceName, homedir);
  } else if (command === 'list') {
    list(homedir, options);
  } else if (command === 'version' || command === '-v') {
    version();
  } else if (commandIsHelp(command) || commandIsBlank(command)) {
    help(options);
  } else if (command === 'config') {
    config();
  } else {
    bamWarn(`Command: ${command} is not valid.`);
  }
})();
