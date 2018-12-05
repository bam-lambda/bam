#!/usr/bin/env node
const os = require('os');

const deploy = require('../src/commands/deploy.js');
const redeploy = require('../src/commands/redeploy.js');
const create = require('../src/commands/create.js');
const get = require('../src/commands/get.js');
const list = require('../src/commands/list.js');
const version = require('../src/commands/version.js');
const destroy = require('../src/commands/destroy.js');
const dbtable = require('../src/commands/dbtable.js');
const help = require('../src/commands/help.js');
const config = require('../src/commands/config.js');
const handleArgs = require('../src/util/handleArgs.js');

const { bamWarn } = require('../src/util/logger.js');
const catchSetupAndConfig = require('../src/util/catchSetupAndConfig.js');

const [,, command, ...args] = process.argv;
const homedir = os.homedir();

(async () => {
  // TODO: add new commands to catchSetupAndConfig
  let resourceName;
  let options = {};

  if (args) ({ resourceName, options } = handleArgs(args, command));
  const shouldContinue = await catchSetupAndConfig(homedir, command, options);
  if (!shouldContinue) return;

  if (command === 'create') {
    await create(resourceName);
  } else if (command === 'deploy') {
    await deploy(resourceName, homedir, options);
  } else if (command === 'redeploy') {
    await redeploy(resourceName, homedir, options);
  } else if (command === 'get') {
    await get(resourceName);
  } else if (command === 'delete') {
    await destroy(resourceName, homedir);
  } else if (command === 'dbtable') {
    await dbtable(resourceName, homedir, options);
  } else if (command === 'list') {
    await list(homedir, options);
  } else if (command === 'version' || command === '-v') {
    await version();
  } else if (command === 'help' || command === '-h' || command === 'man') {
    help();
  } else if (command === 'config') {
    config();
  } else {
    bamWarn(`Command: ${command} is not valid.`);
  }
})();
