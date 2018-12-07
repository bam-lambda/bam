const customizeLambdaWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: `The name "${name}" is already being used in this directory.`,
    invalidSyntax: `"${name}" is invalid. Lambda names must contain 1 to 64 letters, numbers, hyphens, and/or underscores only.`,
    doesNotExistInCwd: `There is no file called "${name}.js".`,
    alreadyExistsOnAws: `"${name}" lambda already exists. If you are trying to overwrite this lambda, please use "bam redeploy ${name}" instead.`,
    doesNotExistOnAws: `Lambda "${name}" does not exist on AWS.`,
    useDeployInstead: `Lambda "${name}" does not exist on AWS. If you are trying to create a new lambda, please use "bam deploy ${name}" instead.`,
    invalidLambda: `Lambda "${name}" does not contain "exports.handler".  Consider using "bam create" to create a local file that is in the correct format.`,
  };
  return warningMessages;
};

const customizeApiWarnings = (resourceData) => {
  const warningMessages = {
    methodsAreInvalid: `One or more of the HTTP methods are invalid: ${resourceData.addMethods.join(' ')}.`,
    willRemoveAllMethods: 'Cannot delete all methods from the api',
  };
  return warningMessages;
};

const customizeTableWarnings = name => (
  {
    invalidTableNameSyntax: `"${name}" is invalid. Table names must contain 3 to 255 letters, numbers, hyphens, periods, and/or underscores only.`,
    tableDoesExistOnAws: `"${name}" table already exists on AWS`,
  }
);

const customizeRoleWarnings = name => (
  {
    roleDoesNotExistOnAws: `Role "${name}" does not exist on AWS`,
  }
);

module.exports = {
  customizeLambdaWarnings,
  customizeApiWarnings,
  customizeTableWarnings,
  customizeRoleWarnings,
};
