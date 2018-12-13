const { distinctElements } = require('./fileUtils');
const { msgAfterAction } = require('./logger');

const getInvalidMethods = (data) => {
  const { addMethods, removeMethods } = data;
  const methods = addMethods.concat(removeMethods);
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ANY'];
  return methods.filter(method => !validMethods.includes(method));
};

const customizeLambdaWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: `Name: "${name}" is already being used in this directory`,
    invalidSyntax: `Name: "${name}" is invalid. Lambda names must be 1 to 64 characters in length and contain only letters, numbers, hyphens, or underscores.`,
    doesNotExistInCwd: msgAfterAction('file', name, 'exist in this directory', 'does not'),
    alreadyExistsOnAws: `${msgAfterAction('lambda', name, 'exists', 'already')}.  To overwrite this lambda, please use "bam redeploy ${name}".`,
    doesNotExistOnAws: msgAfterAction('lambda', name, 'exist', 'does not'),
    useDeployInstead: `${msgAfterAction('lambda', name, 'exist', 'does not')}. To deploy a new lambda, please use "bam deploy ${name}".`,
    invalidLambda: `${msgAfterAction('lambda', name, 'contain exports.handler', 'does not')}.  To create a local lambda file in the correct format, please use "bam create ${name}".`,
  };
  return warningMessages;
};

const customizeApiWarnings = ({ addMethods = [], removeMethods = [] }) => {
  const warningMessages = {
    cannotRemoveMethodMadeInConsole: `One or more methods were not added with BAM! initially and cannot be removed: ${removeMethods.join(' ')}.  Consider using "bam list" to see which methods can be removed.`,
    methodsAreInvalid: `Invalid http method(s): "${getInvalidMethods(distinctElements(addMethods.concat(removeMethods))).join(', ')}"`,
    willRemoveAllMethods: 'Cannot delete all methods connected to this endpoint.  Please consider using bam delete',
  };
  return warningMessages;
};

const customizeTableWarnings = name => (
  {
    invalidTableNameSyntax: `${msgAfterAction('name', name, '', 'is invalid')}. Table names must be 3 to 255 characters in length and contain only letters, numbers, hyphens, periods, or underscores.`,
    tableDoesExistOnAws: msgAfterAction('table', name, 'exists', 'already'),
  }
);

const customizeRoleWarnings = name => (
  {
    roleDoesNotExistOnAws: msgAfterAction('role', name, 'exist', 'does not'),
  }
);

module.exports = {
  customizeLambdaWarnings,
  customizeApiWarnings,
  customizeTableWarnings,
  customizeRoleWarnings,
};
