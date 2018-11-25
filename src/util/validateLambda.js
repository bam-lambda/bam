const { doesLambdaExist } = require('../aws/doesResourceExist.js');
const { exists } = require('../util/fileUtils.js');

const customizeWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: `The name "${name}" is already being used in this directory. Please select another.`,
    doesNotExist: `There is no file called "${name}.js" in this directory.`,
    invalidSyntax: `"${name}" is invalid. Lambda names must contain 1 to 64 letters, numbers, hyphens, and/or underscores only.`,
    alreadyExists: `"${name}" lambda already exists. If you are trying to overwrite this lambda, please use the "redeploy" command.`,
  };

  return warningMessages;
};

const lambdaExistsInCwd = async (name) => {
  const cwd = process.cwd();
  const status = await exists(`${cwd}/${name}.js`);
  return status;
};

const lambdaHasValidName = name => (
  (/^[a-zA-Z0-9-_]+$/).test(name) && name.length < 64
);

const lambdaExistsOnAws = async (name) => {
  const status = await doesLambdaExist(name);
  return status;
};

const validateLambdaDeployment = async (name) => {
  const warnings = customizeWarnings(name);
  let msg;

  if (!lambdaHasValidName(name)) {
    msg = warnings.invalidSyntax;
  } else if (!(await lambdaExistsInCwd(name))) {
    msg = warnings.doesNotExist;
  } else if (await lambdaExistsOnAws(name)) {
    msg = warnings.alreadyExists;
  }

  return msg;
};

const validateLambdaCreation = async (name) => {
  const warnings = customizeWarnings(name);
  let msg;

  if (await lambdaExistsInCwd(name)) {
    msg = warnings.nameIsTaken;
  } else if (!lambdaHasValidName(name)) {
    msg = warnings.invalidSyntax;
  }

  return msg;
};

module.exports = {
  validateLambdaDeployment,
  validateLambdaCreation,
};
