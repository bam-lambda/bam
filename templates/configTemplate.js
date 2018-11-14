const getRegion = require('../src/util/getRegion.js');

module.exports = function configTemplate(roleName) {
  return {
    role: roleName,
    region: getRegion(),
  };
};
