#!/usr/bin/env node
const os = require('os');

const handleArgs = require('../src/util/handleArgs');
const { bamError } = require('../src/util/logger');
const catchSetupAndConfig = require('../src/util/catchSetupAndConfig');
const bamSpinner = require('../src/util/spinner');
const executeCommand = require('../src/commands/executeCommand');

const [,, command, ...args] = process.argv;
const homedir = os.homedir();

(async () => {
  try {
    let resourceName;
    let options = {};
    if (args) ({ resourceName, options } = handleArgs(args, command));
    const shouldContinue = await catchSetupAndConfig(homedir, command);
    if (!shouldContinue) return;

    await executeCommand(command, resourceName, options, homedir);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
})();
