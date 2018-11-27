const os = require('os');

const {
  readFile,
  readConfig,
  exists,
} = require('./fileUtils');

const homedir = os.homedir();

module.exports = async function getRegion() {
  const configExistsInBamDir = await exists(`${homedir}/.bam/config.json`);
  if (configExistsInBamDir) {
    const config = await readConfig(homedir);
    const { region } = config;
    return region;
  } else {
    const configStr = await readFile(`${homedir}/.aws/config`, 'utf8');
    const defaultProfile = configStr.split('[').find(el => el.match('default'));
    const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
    return regionLine.split('= ')[1];
  }
};
