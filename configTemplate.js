const fs = require('fs');
const { homedir } = require('os');

const getRegion = () => {
  const configStr = fs.readFileSync(homedir() + '/.aws/config', 'utf8');
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  return regionLine.split('= ')[1];
};

module.exports = function configTemplate(roleName) {
  return {
    role: roleName,
    region: getRegion(),
  };
};
