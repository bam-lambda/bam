const fs = require('fs');
const getRegion = require('./getRegion.js');

module.exports = function configTemplate(roleName) {
  return {
    role: roleName,
    region: getRegion(),
  };
};
