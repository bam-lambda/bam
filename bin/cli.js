#!/usr/bin/env node
const os = require('os');

const init = require('../src/util/init.js');
const deploy = require('../src/commands/deploy.js');
const create = require('../src/commands/create.js');
const list = require('../src/commands/list.js');
const version = require('../src/commands/version.js');
const help = require('../src/commands/help.js');
const config = require('../src/commands/config.js');
const { bamWarn } = require('../src/util/fancyText.js');
const { exists } = require('../src/util/fileUtils.js');

const defaultRole = 'bamRole';
const [,, command, lambdaName] = process.argv;
const homedir = os.homedir();

(async () => {
  const bamDirExists = await exists(`${homedir}/.bam`);
  if (!bamDirExists) {
    await init(defaultRole, homedir);
    if (command === 'config') return; // don't config twice
  }

  if (command === 'create') {
    // are these awaits nec?
    await create(lambdaName, homedir);
  } else if (command === 'deploy') {
    await deploy(lambdaName, homedir);
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
