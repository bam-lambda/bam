const {
  log,
  vertPadding,
} = require('../util/logger');

const {
  getOptionsCommands,
  formatCommands,
  formatCommandOptions,
  commands,
} = require('../util/helpHelpers');

const logOptions = (optionsCommands, optionsMsg) => {
  if (optionsCommands.length === 0) {
    log('There are no options for this command\n');
  } else {
    log('Options:');
    log(`${optionsMsg}\n`);
  }
};

module.exports = function help(optionsObj) {
  const msg = `\nCommands:\n${commands.map(formatCommands).join('\n')}\n`;
  log(msg);

  const optionsCommands = getOptionsCommands(optionsObj);
  if (optionsCommands) {
    const optionsMsg = optionsCommands.map(formatCommandOptions).join(vertPadding);
    logOptions(optionsCommands, optionsMsg);
  } else {
    log('Pass in flags for any command (--[commandName]) to see options for that command');
    log('Pass in --all to see options for all commands\n');
  }
};
