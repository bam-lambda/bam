const getRegion = require('../src/util/getRegion.js');

module.exports = async function configTemplate(roleName) {
  const region = await getRegion();

  return {
    role: roleName,
    region,
  };
};
