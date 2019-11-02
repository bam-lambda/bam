const { msgAfterAction } = require('./logger');
const { distinctElements } = require('./fileUtils');

const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ANY'];
const validMethodsStr = `${validMethods
  .slice(0, -2)
  .join(', ')}, and ${validMethods.slice(-1)}`;
const pluralizeMethodsMsg = (msg) =>
  msg
    .replace('Method', 'Methods')
    .replace('was', 'were')
    .replace(/\bis\b/, 'are')
    .replace('does', 'do');

const getInvalidMethods = (data) => {
  const { addMethods, removeMethods } = data;
  const methods = addMethods.concat(removeMethods);
  return distinctElements(
    methods.filter((method) => !validMethods.includes(method)),
  );
};

const getInvalidMethodsMsg = (data) => {
  const invalidMethods = getInvalidMethods(data);

  let msg = `${msgAfterAction(
    'Http Method',
    invalidMethods.join(', '),
    'invalid',
    'is',
  )}`;
  if (invalidMethods.length > 1) msg = pluralizeMethodsMsg(msg);

  return `${msg}.\nValid Http methods for use with BAM! are ${validMethodsStr}.`;
};

const getCannotRemoveMethodMadeInConsoleMsg = (
  removeMethods,
  existingMethods,
) => {
  const nonexistentMethods = removeMethods.filter(
    (methodBeingRemoved) => !existingMethods.includes(methodBeingRemoved),
  );

  const notAddedOrDoesntExistStr =
    'does not exist for this endpoint (or was not added using BAM!)';

  let msg = `${msgAfterAction(
    'Http Method',
    nonexistentMethods.join(', '),
    'and cannot be removed',
    notAddedOrDoesntExistStr,
  )}`;
  if (nonexistentMethods.length > 1) msg = pluralizeMethodsMsg(msg);

  return `${msg}.\nConsider using "bam list" to see which methods can be removed.`;
};

const customizeLambdaWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: msgAfterAction(
      'name',
      name,
      'already being used in this directory',
      'is',
    ),
    invalidSyntax: `${msgAfterAction(
      'name',
      name,
      'invalid',
      'is',
    )}. Lambda names must be 1 to 64 characters in length and contain only letters, numbers, hyphens, or underscores.`,
    doesNotExistInCwd: msgAfterAction(
      'file',
      name,
      'exist in this directory',
      'does not',
    ),
    alreadyExistsOnAws: `${msgAfterAction(
      'lambda',
      name,
      'exists',
      'already',
    )}.  To overwrite this lambda, please use "bam redeploy ${name}".`,
    doesNotExistOnAws: msgAfterAction('lambda', name, 'exist', 'does not'),
    useDeployInstead: `${msgAfterAction(
      'lambda',
      name,
      'exist',
      'does not',
    )}. To deploy a new lambda, please use "bam deploy ${name}".`,
    invalidLambda: `${msgAfterAction(
      'lambda',
      name,
      'contain exports.handler',
      'does not',
    )}.  To create a local lambda file in the correct format, please use "bam create ${name}".`,
  };
  return warningMessages;
};

const customizeApiWarnings = ({
  addMethods = [],
  removeMethods = [],
  existingMethods = [],
} = {}) => {
  const warningMessages = {
    cannotRemoveMethodMadeInConsole: getCannotRemoveMethodMadeInConsoleMsg(
      removeMethods,
      existingMethods,
    ),
    methodsAreInvalid: getInvalidMethodsMsg({ addMethods, removeMethods }),
    willRemoveAllMethods:
      'Cannot delete all methods connected to this endpoint.  Consider using "bam delete"',
  };
  return warningMessages;
};

const customizeTableWarnings = (name) => ({
  invalidTableNameSyntax: `${msgAfterAction(
    'name',
    name,
    '',
    'is invalid',
  )}. Table names must be 3 to 255 characters in length and contain only letters, numbers, hyphens, periods, or underscores.`,
  tableDoesExistOnAws: msgAfterAction('table', name, 'exists', 'already'),
});

const customizeRoleWarnings = (name) => ({
  roleDoesNotExistOnAws: msgAfterAction('role', name, 'exist', 'does not'),
});

module.exports = {
  customizeLambdaWarnings,
  customizeApiWarnings,
  customizeTableWarnings,
  customizeRoleWarnings,
};
