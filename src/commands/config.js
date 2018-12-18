const os = require('os');
const getUserDefaults = require('../util/getUserDefaults');
const { bamLog } = require('../util/logger');

const homedir = os.homedir();

module.exports = async function config() {
  await getUserDefaults(homedir);
  bamLog('User configurations have been updated');
};
