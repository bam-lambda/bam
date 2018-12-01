const { doesLambdaExist, doesTableExist } = require('../aws/doesResourceExist');
const { readdir, exists } = require('../util/fileUtils');
const {
  customizeLambdaWarnings,
  customizeApiWarnings,
  customizeTableWarnings,
} = require('./validationMessages.js');

// helper methods
const lambdaFileExistsWithinDir = async (name) => {
  const cwd = process.cwd();
  const lambdaFileExists = await exists(`${cwd}/${name}/${name}.js`);
  return lambdaFileExists;
};

const lambdaExistsInCwd = async (name) => {
  const cwd = process.cwd();
  const files = await readdir(cwd);

  const dirOrFileExists = files.some((file) => {
    const fileWithoutExtension = file.split('.')[0];
    return fileWithoutExtension === name;
  });

  if (dirOrFileExists) {
    const dirExists = files.includes(name);
    return (dirExists ? lambdaFileExistsWithinDir(name) : true);
  }

  return false;
};

const lambdaHasValidName = (name) => {
  if (!name) return false;
  return (/^[a-zA-Z0-9\-_]+$/).test(name) && name.length < 64;
};

const lambdaExistsOnAws = async (name) => {
  const status = await doesLambdaExist(name);
  return status;
};

const tableHasValidName = (name) => {
  if (!name) return false;
  return (/^[a-zA-Z0-9\-_.]{3,255}$/).test(name);
};

const tableExistsOnAws = async (name) => {
  const status = await doesTableExist(name);
  return status;
};

const validateResource = async (name, validations, customWarnings) => {
  const warnings = customWarnings(name);
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
  const status = await validateResource(name, validations, customizeLambdaWarnings);
  return status;
};

const validateLambdaReDeployment = async (name) => {
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
      feedbackType: 'useDeployInstead',
      affirmative: false,
    },
  ];
  const status = await validateResource(name, validations, customizeLambdaWarnings);
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
  const status = await validateResource(name, validations, customizeLambdaWarnings);
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
  const status = await validateResource(name, validations, customizeLambdaWarnings);
  return status;
};

const validateTableCreation = async (name) => {
  const validations = [
    {
      validation: tableHasValidName,
      feedbackType: 'invalidTableNameSyntax',
      affirmative: false,
    }, {
      validation: tableExistsOnAws,
      feedbackType: 'tableDoesExistOnAws',
      affirmative: true,
    },
  ];
  const status = await validateResource(name, validations, customizeTableWarnings);
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
  validateLambdaReDeployment,
  validateLambdaCreation,
  validateApiMethods,
  validateTableCreation,
};
