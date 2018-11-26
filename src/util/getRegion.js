const os = require('os');

const { readFile } = require('./fileUtils');

module.exports = async function getRegion() {
  const homedir = os.homedir();
  const configStr = await readFile(`${homedir}/.aws/config`, 'utf8');
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  return regionLine.split('= ')[1];
};
