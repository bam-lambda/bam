#!/usr/bin/env node
const os = require('os');

const deploy = require('../src/commands/deploy.js');
const create = require('../src/commands/create.js');
const list = require('../src/commands/list.js');
const version = require('../src/commands/version.js');
const destroy = require('../src/commands/destroy.js');
const help = require('../src/commands/help.js');
const config = require('../src/commands/config.js');
const { bamWarn } = require('../src/util/fancyText.js');
const catchSetupAndConfig = require('../src/util/catchSetupAndConfig.js');

const [,, command, lambdaName] = process.argv;
const homedir = os.homedir();

(async () => {
  const shouldContinue = await catchSetupAndConfig(homedir, command);
  if (!shouldContinue) return;

  if (command === 'create') {
    await create(lambdaName, homedir);
  } else if (command === 'deploy') {
    await deploy(lambdaName, homedir);
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
