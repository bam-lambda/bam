const { homedir } = require('os');
const { readFileSync } = require('fs');

const { readFile } = require('./fileUtils');

const getRegionFromConfigStr = (configStr) => {
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  const [, region] = regionLine.split('= ');
  return region;
};

const getRegion = () => {
  const configStr = readFileSync(`${homedir}/.aws/config`, 'utf8');
  return getRegionFromConfigStr(configStr);
};

const asyncGetRegion = async () => {
  const configStr = await readFile(`${homedir}/.aws/config`, 'utf8');
  return getRegionFromConfigStr(configStr);
};

module.exports = {
  getRegion,
  asyncGetRegion,
};
