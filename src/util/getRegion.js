const { homedir } = require('os');
const { readFileSync } = require('fs');

// const {
  // readFile,
  // readConfig,
  // exists,
// } = require('./fileUtils');

// module.exports = async function getRegion() {
  // const configExistsInBamDir = await exists(`${homedir}/.bam/config.json`);
  // let region;
  // if (configExistsInBamDir) {
    // const config = await readConfig(homedir);
    // ({ region } = config);
  // } else {
    // const configStr = await readFile(`${homedir}/.aws/config`, 'utf8');
    // const defaultProfile = configStr.split('[').find(el => el.match('default'));
    // const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
    // [, region] = regionLine.split('= ');
  // }

  // return region;
// };

module.exports = function getRegion() {
  const configJSON = readFileSync(`${homedir}/.bam/config.json`);
  const config = JSON.parse(configJSON);
  const { region } = config;
  return region;
};
