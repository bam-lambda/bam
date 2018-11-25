const os = require('os');
const getUserDefaults = require('../util/getUserDefaults');

const homedir = os.homedir();

module.exports = async function config() {
  await getUserDefaults(homedir);
};
