const { doesLambdaExist } = require('../aws/doesResourceExist.js');
const { readdir } = require('../util/fileUtils.js');

// messages
const customizeLambdaWarnings = (name) => {
  const warningMessages = {
    nameIsTaken: `The name "${name}" is already being used in this directory. Please select another.`,
    invalidSyntax: `"${name}" is invalid. Lambda names must contain 1 to 64 letters, numbers, hyphens, and/or underscores only.`,
    doesNotExistInCwd: `There is no file called "${name}.js" in this directory.`,
    alreadyExistsOnAws: `"${name}" lambda already exists. If you are trying to overwrite this lambda, please use the "redeploy" command.`,
    doesNotExistOnAws: `Lambda "${name}" does not exist on AWS.`,
  };
  return warningMessages;
};

const customizeApiWarnings = (methods) => {
  const warningMessages = {
    invalidMethods: `One or more of the HTTP methods are invalid: ${methods.join(' ')}`,
  };
  return warningMessages;
};

// helper methods
const lambdaExistsInCwd = async (name) => {
  const cwd = process.cwd();
  const files = await readdir(cwd);
  return files.some((file) => {
    const fileWithoutExtension = file.split('.')[0];
    return fileWithoutExtension === name;
  });
};

const lambdaHasValidName = (name) => {
  if (!name) return false;
  return (/^[a-zA-Z0-9-_]+$/).test(name) && name.length < 64;
};

const lambdaExistsOnAws = async (name) => {
  const status = await doesLambdaExist(name);
  return status;
};

const validateLambda = async (name, validations) => {
  const warnings = customizeLambdaWarnings(name);
  let msg;

  for (let i = 0; i < validations.length; i += 1) {
    const { validation, feedbackType, affirmative } = validations[i];
    const check = affirmative ? await validation(name) : !(await validation(name));
    if (check) {
      msg = warnings[feedbackType];
      break;
    }
  }

  return msg;
};

// validations
const validateLambdaDeployment = async (name) => {
  const validations = [
    {
      validation: lambdaHasValidName,
      feedbackType: 'invalidSyntax',
      affirmative: false,
    }, {
      validation: lambdaExistsInCwd,
      feedbackType: 'doesNotExistInCwd',
      affirmative: false,
    }, {
      validation: lambdaExistsOnAws,
      feedbackType: 'alreadyExistsOnAws',
      affirmative: true,
    },
  ];
  const status = await validateLambda(name, validations);
  return status;
};

const validateLambdaCreation = async (name) => {
  const validations = [
    {
      validation: lambdaExistsInCwd,
      feedbackType: 'nameIsTaken',
      affirmative: true,
    }, {
      validation: lambdaHasValidName,
      feedbackType: 'invalidSyntax',
      affirmative: false,
    },
  ];
  const status = await validateLambda(name, validations);
  return status;
};

const validateLambdaRetrieval = async (name) => {
  const validations = [
    {
      validation: lambdaHasValidName,
      feedbackType: 'invalidSyntax',
      affirmative: false,
    }, {
      validation: lambdaExistsInCwd,
      feedbackType: 'nameIsTaken',
      affirmative: true,
    }, {
      validation: lambdaExistsOnAws,
      feedbackType: 'doesNotExistOnAws',
      affirmative: false,
    },
  ];
  const status = await validateLambda(name, validations);
  return status;
};

const validateApiMethods = (methods) => {
  const warnings = customizeApiWarnings(methods);
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ANY'];
  const methodsAreValid = methods.every(method => validMethods.includes(method));
  let msg;

  if (!methodsAreValid) {
    msg = warnings.invalidMethods;
  }

  return msg;
};

module.exports = {
  validateLambdaRetrieval,
  validateLambdaDeployment,
  validateLambdaCreation,
  validateApiMethods,
};
