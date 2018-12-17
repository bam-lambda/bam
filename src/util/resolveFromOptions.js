const { readConfig, distinctElements } = require('./fileUtils');
const checkForOptionType = require('./checkForOptionType');

const dbRole = 'databaseBamRole';

const resolveRoleNameFromOptions = async (options, path) => {
  const config = await readConfig(path);
  const { accountNumber, role } = config;
  const permitDb = checkForOptionType(options, 'permitDb');
  const revokeDb = checkForOptionType(options, 'revokeDb');

  if (options.role && options.role[0]) {
    return options.role[0];
  } else if (revokeDb) {
    return role;
  } else if (permitDb) {
    return dbRole;
  }
};

const resolveHttpMethodsFromOptions = (api, options) => {
  let addMethods = options.methods || options.method;
  let removeMethods = options.rmMethods || options.rmMethod;
  let existingMethods = [];

  addMethods = addMethods
    ? distinctElements(addMethods.map(m => m.toUpperCase())) : [];

  removeMethods = removeMethods
    ? distinctElements(removeMethods.map(m => m.toUpperCase())) : [];

  if (api.resources.length > 0) {
    const resource = api.resources.find(res => res.path === '/');
    existingMethods = Object.keys(resource.resourceMethods || {});
  }

  if (existingMethods.length === 0 && addMethods.length === 0) {
    addMethods.push('GET');
  }


  api.addMethods = addMethods;
  api.removeMethods = removeMethods;
  api.existingMethods = existingMethods;
};

module.exports = {
  resolveRoleNameFromOptions,
  resolveHttpMethodsFromOptions,
};
