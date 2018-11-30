const customizeLambdaWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: `The name "${name}" is already being used in this directory. Please select another.`,
    invalidSyntax: `"${name}" is invalid. Lambda names must contain 1 to 64 letters, numbers, hyphens, and/or underscores only.`,
    doesNotExistInCwd: `There is no file called "${name}.js" in this directory.`,
    alreadyExistsOnAws: `"${name}" lambda already exists. If you are trying to overwrite this lambda, please use "bam redeploy ${name}" instead.`,
    doesNotExistOnAws: `Lambda "${name}" does not exist on AWS.`,
    useDeployInstead: `Lambda "${name}" does not exist on AWS. If you are trying to create a new lambda, please use "bam deploy ${name}" instead.`,
  };
  return warningMessages;
};

const customizeApiWarnings = (methods) => {
  const warningMessages = {
    invalidMethods: `One or more of the HTTP methods are invalid: ${methods.join(' ')}`,
  };
  return warningMessages;
};

module.exports = {
  customizeLambdaWarnings,
  customizeApiWarnings,
};
