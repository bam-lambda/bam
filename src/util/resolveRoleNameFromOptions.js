const { readConfig } = require('../util/fileUtils');
const checkForOptionType = require('../util/checkForOptionType');

const dbRole = 'databaseBamRole'; // TODO -- refactor for testing

module.exports = async function resolveRoleNameFromOptions(options, path) {
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
