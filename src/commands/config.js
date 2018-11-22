const getUserDefaults = require('../util/getUserDefaults.js');
const os = require('os');
const homedir = os.homedir();

module.exports = async function config() {
  await getUserDefaults(homedir);
};
