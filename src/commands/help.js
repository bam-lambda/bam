const {
  log,
  getStyledText,
  bamText,
  indent,
  indentFurther,
  vertPadding,
} = require('../util/logger');

const commandDetails = {
  deploy: {
    description: 'deploys lambda + endpoint',
    options: [
      { name: 'role', description: 'specifies role for this deployment' },
      { name: 'permitDb', description: 'adds policy with scan, put, get, delete DynamoDB permissions' },
      { name: 'methods', description: 'specifies HTTP method(s) for the API Gateway' },
      { name: 'lambdaOnly', description: 'deploys lambda without an API gateway' },
    ],
    hasResource: true,
  },
  redeploy: {
    description: 'updates existing lambda and endpoint',
    options: [
      { name: 'role', description: 'specifies role for this deployment' },
      { name: 'permitDb', description: 'adds policy with scan, put, get, delete DynamoDB permissions' },
      { name: 'methods', description: 'specifies HTTP method(s) for the API Gateway' },
      { name: 'rmmethods', description: 'specifies HTTP method(s) to be removed from the API Gateway' },
      { name: 'addApi', description: 'adds API Gateway endpoint (if none exists) that is integrated with the lamdba' },
    ],
    hasResource: true,
  },
  create: {
    description: 'updates existing lambda and endpoint',
    options: [
      { name: 'html', description: 'creates local directory containing index.html, main.css, and [resourceName].js' },
      { name: 'invoker', description: 'creates local file/directory with [resourceName].js templated to invoke another lambda' },
    ],
    hasResource: true,
  },
  dbtable: {
    description: 'creates DynamoDB table',
    options: [],
    hasResource: true,
  },
  delete: {
    description: 'deletes existing lambda + endpoint',
    options: [
      { name: 'dbtable', description: 'deletes DynamoDB table' },
      { name: 'apiOnly', description: 'deletes only the API Gateway' },
      { name: 'lambdaOnly', description: 'deletes only the lambda' },
    ],
    hasResource: true,
  },
  get: {
    description: 'pulls lambda code from AWS into a local directory',
    options: [],
    kasResource: true,
  },
  list: {
    description: 'lists lambdas and tables deployed with BAM!',
    options: [
      { name: 'dbtables', description: 'lists only DynamoDB tables created with BAM!' },
      { name: 'lambdas', description: 'lists only lambdas and associated API Gateway endpoints' },
    ],
    hasResource: false,
  },
  config: {
    description: 'updates default user settings',
    options: [],
    hasResource: false,
  },
};

const lineLengthBeforeDescription = 30;
const getSpaces = num => ' '.repeat(num);

const formatCommands = (command) => {
  const commandObj = commandDetails[command];
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
  const { options } = commandDetails[command];
  return `${indent}${bamText(command)}: \n${options.map(formatOption).join('\n')}`;
};

const commands = Object.keys(commandDetails);

const getOptions = (optionsArr) => {
  const commandsWithOptions = commands.filter(command => (
    commandDetails[command].options.length > 0
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

module.exports = function help(optionsObj) {
  const msg = `\nCommands:\n${commands.map(formatCommands).join('\n')}\n`;
  log(msg);

  const optionsCommands = getOptionsCommands(optionsObj);
  if (optionsCommands) {
    const optionsMsg = optionsCommands.map(formatCommandOptions).join(vertPadding);
    log('Options:');
    log(`${optionsMsg}\n`);
  } else {
    log('Pass in flags for any command (--commandName) to see options for that command\n');
  }
};
