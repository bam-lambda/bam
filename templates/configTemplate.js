const { asyncGetRegion } = require('../src/util/getRegion');

module.exports = async function configTemplate(roleName) {
  const region = await asyncGetRegion();

  return {
    role: roleName,
    region,
  };
};
