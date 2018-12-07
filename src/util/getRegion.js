const os = require('os');
const { promisify } = require('util');
const { readFile, readFileSync } = require('fs');

const asyncReadFile = promisify(readFile);
const homedir = os.homedir();

const getRegionFromConfigStr = (configStr) => {
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  const [, region] = regionLine.split('= ');
  return region;
};

const getRegion = () => {
  try {
    const configStr = readFileSync(`${homedir}/.aws/config`, 'utf8');
    return getRegionFromConfigStr(configStr);
  } catch (err) {
    return false;
  }
};

const asyncGetRegion = async () => {
  const configStr = await asyncReadFile(`${homedir}/.aws/config`, 'utf8');
  return getRegionFromConfigStr(configStr);
};

module.exports = {
  getRegion,
  asyncGetRegion,
};
