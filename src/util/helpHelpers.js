const {
  getStyledText,
  bamText,
  indent,
  indentFurther,
} = require('./logger');

const commandDescriptions = require('./commandDescriptions');

const lineLengthBeforeDescription = 30;
const getSpaces = num => ' '.repeat(num);

const formatCommands = (command) => {
  const commandObj = commandDescriptions[command];
  let formattedStr = `${indent}${bamText(command)}`;

  const resourceStr = ' [resourceName]';
  const formattedResourceStr = resourceStr.replace(
    'resourceName',
    getStyledText('resourceName', 'green'),
  );
  if (commandObj.hasResource) formattedStr += formattedResourceStr;

  let numOfSpaces = lineLengthBeforeDescription - command.length;
  if (commandObj.hasResource) numOfSpaces -= resourceStr.length;
  const spaces = getSpaces(numOfSpaces);
  formattedStr += `${spaces}${commandObj.description}`;
  return formattedStr;
};

const formatOption = option => (
  `${indentFurther}${getStyledText(option.name, 'green')}: ${option.description}`
);

const formatCommandOptions = (command) => {
  const { options } = commandDescriptions[command];
  return `${indent}${bamText(command)}: \n${options.map(formatOption).join('\n')}`;
};

const commands = Object.keys(commandDescriptions);

const getOptions = (optionsArr) => {
  const commandsWithOptions = commands.filter(command => (
    commandDescriptions[command].options.length > 0
  ));

  return optionsArr.includes('all')
    ? commandsWithOptions
    : optionsArr.filter(option => (
      commandsWithOptions.includes(option.toLowerCase())
    ));
};

const getOptionsCommands = (optionsObj) => {
  const optionsArr = Object.keys(optionsObj);
  let options;
  if (optionsArr.length > 0) {
    options = getOptions(optionsArr);
  }
  return options;
};

module.exports = {
  getOptionsCommands,
  formatCommands,
  formatCommandOptions,
  commands,
};
