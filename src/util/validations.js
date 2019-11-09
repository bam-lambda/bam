const { asyncGetRegion } = require('./getRegion');

const {
  doesLambdaExist,
  doesTableExist,
  doesRoleExist,
} = require('../aws/doesResourceExist');

const {
  exists,
  readFile,
  readApisLibrary,
} = require('../util/fileUtils');

const {
  customizeLambdaWarnings,
  customizeApiWarnings,
  customizeTableWarnings,
  customizeRoleWarnings,
  customizeConfigWarnings,
} = require('./validationMessages');

const cwd = process.cwd();

// helper methods
const lambdaFileExistsWithinDir = async (name) => {
  const lambdaFileExists = await exists(`${cwd}/${name}/${name}.js`);
  return lambdaFileExists;
};

const lambdaExistsInCwd = async (name) => {
  const lambdaFileExists = await exists(`${cwd}/${name}.js`);
  return lambdaFileExists;
};

const lambdaHasValidName = (name) => {
  if (!name) return false;
  return (/^[a-zA-Z0-9\-_]+$/).test(name) && name.length < 64;
};

const lambdaIsValidLambda = async (name) => {
  const path = `${cwd}/${name}.js`;
  const lambdaFile = await readFile(path, 'utf8');
  return /exports\.handler/.test(lambdaFile);
};

const dirIsValidLambda = async (name) => {
  const path = `${cwd}/${name}/${name}.js`;
  const lambdaFile = await readFile(path, 'utf8');
  return /exports\.handler/.test(lambdaFile);
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

const roleExistsOnAws = async (name) => {
  const status = await doesRoleExist(name);
  return status;
};

const methodsAreValid = ({ addMethods = [], removeMethods = [] } = {}) => {
  const methods = addMethods.concat(removeMethods);
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ANY'];
  return methods.every(method => validMethods.includes(method));
};

const removingLastMethod = ({ addMethods = [], removeMethods = [], existingMethods = [] } = {}) => {
  const result = existingMethods.concat(addMethods).filter(m => !removeMethods.includes(m));
  return result.length === 0;
};

const removeMethodsDeployedPreviouslyWithBam = async ({
  addMethods = [],
  removeMethods = [],
  resourceName,
  path,
}) => {
  const filteredRemoveMethods = removeMethods.filter(m => !addMethods.includes(m));
  const region = await asyncGetRegion();
  const apis = await readApisLibrary(path);
  const api = apis[region][resourceName];
  const existingBamMethods = api ? Object.keys(api.methodPermissionIds) : [];
  const result = filteredRemoveMethods.filter(m => !existingBamMethods.includes(m));
  return result.length === 0;
};

const isANodeRuntime = (name) => {
  return name.includes('node');
};

const runtimeIsValid = (name) => {
  const validNodeRuntimes = ['nodejs10.x'];
  return validNodeRuntimes.includes(name);
};

const validateResource = async (resourceData, validations, customWarnings) => {
  const warnings = customWarnings(resourceData);
  let msg;

  for (let i = 0; i < validations.length; i += 1) {
    const { validation, feedbackType, affirmative } = validations[i];
    const isValid = await validation(resourceData);
    const check = affirmative ? isValid : !isValid;

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
    }, {
      validation: lambdaIsValidLambda,
      feedbackType: 'invalidLambda',
      affirmative: false,
    },
  ];
  const status = await validateResource(name, validations, customizeLambdaWarnings);
  return status;
};

const validateLambdaDirDeployment = async (name) => {
  const validations = [
    {
      validation: lambdaHasValidName,
      feedbackType: 'invalidSyntax',
      affirmative: false,
    }, {
      validation: lambdaFileExistsWithinDir,
      feedbackType: 'doesNotExistInCwd',
      affirmative: false,
    }, {
      validation: lambdaExistsOnAws,
      feedbackType: 'alreadyExistsOnAws',
      affirmative: true,
    }, {
      validation: dirIsValidLambda,
      feedbackType: 'invalidLambda',
      affirmative: false,
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
    }, {
      validation: lambdaIsValidLambda,
      feedbackType: 'invalidLambda',
      affirmative: false,
    },
  ];
  const status = await validateResource(name, validations, customizeLambdaWarnings);
  return status;
};

const validateLambdaDirReDeployment = async (name) => {
  const validations = [
    {
      validation: lambdaHasValidName,
      feedbackType: 'invalidSyntax',
      affirmative: false,
    }, {
      validation: lambdaFileExistsWithinDir,
      feedbackType: 'doesNotExistInCwd',
      affirmative: false,
    }, {
      validation: lambdaExistsOnAws,
      feedbackType: 'useDeployInstead',
      affirmative: false,
    }, {
      validation: dirIsValidLambda,
      feedbackType: 'invalidLambda',
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

const validateRoleAssumption = async (name) => {
  const validations = [
    {
      validation: roleExistsOnAws,
      feedbackType: 'roleDoesNotExistOnAws',
      affirmative: false,
    },
  ];
  const status = await validateResource(name, validations, customizeRoleWarnings);
  return status;
};

const validateApiMethods = async (resourceData) => {
  const validations = [
    {
      validation: methodsAreValid,
      feedbackType: 'methodsAreInvalid',
      affirmative: false,
    },
    {
      validation: removeMethodsDeployedPreviouslyWithBam,
      feedbackType: 'cannotRemoveMethodMadeInConsole',
      affirmative: false,
    },
    {
      validation: removingLastMethod,
      feedbackType: 'willRemoveAllMethods',
      affirmative: true,
    },
  ];
  const status = await validateResource(resourceData, validations, customizeApiWarnings);
  return status;
};

const validateNodeRuntime = async (name) => {
  const validations = [
    {
      validation: isANodeRuntime,
      feedbackType: 'nodeRuntimeRequired',
      affirmative: false,
    },
    {
      validation: runtimeIsValid,
      feedbackType: 'invalidNodeRuntime',
      affirmative: false,
    }
  ];
  const status = await validateResource(name, validations, customizeConfigWarnings);
  return status;
};

module.exports = {
  lambdaExistsInCwd,
  lambdaFileExistsWithinDir,
  validateLambdaRetrieval,
  validateLambdaDeployment,
  validateLambdaDirDeployment,
  validateLambdaReDeployment,
  validateLambdaDirReDeployment,
  validateLambdaCreation,
  validateApiMethods,
  validateTableCreation,
  validateRoleAssumption,
  validateNodeRuntime,
};
