#!/usr/bin/env node
const os = require('os');

const deploy = require('../src/commands/deploy.js');
const redeploy = require('../src/commands/redeploy.js');
const create = require('../src/commands/create.js');
const get = require('../src/commands/get.js');
const list = require('../src/commands/list.js');
const version = require('../src/commands/version.js');
const destroy = require('../src/commands/destroy.js');
const help = require('../src/commands/help.js');
const config = require('../src/commands/config.js');
const handleArgs = require('../src/util/handleArgs.js');

const { bamWarn } = require('../src/util/logger.js');
const catchSetupAndConfig = require('../src/util/catchSetupAndConfig.js');

const [,, command, ...args] = process.argv;
const homedir = os.homedir();

(async () => {
  // TODO: add new commands to catchSetupAndConfig
  let lambdaName;
  let options;
  const shouldContinue = await catchSetupAndConfig(homedir, command);
  if (!shouldContinue) return;
  if (args) ({ lambdaName, options } = handleArgs(args));

  if (command === 'create') {
    await create(lambdaName);
  } else if (command === 'deploy') {
    await deploy(lambdaName, homedir, options);
  } else if (command === 'redeploy') {
    await redeploy(lambdaName, homedir, options);
  } else if (command === 'get') {
    await get(lambdaName, homedir);
  } else if (command === 'delete') {
    await destroy(lambdaName, homedir);
  } else if (command === 'list') {
    await list(homedir);
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
