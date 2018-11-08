const fs = require('fs');
const { homedir } = require('os');

const getRegion = () => {
  const configStr = fs.readFileSync(homedir() + '/.aws/config', 'utf8');
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  return regionLine.split('= ')[1];
};

const config = (roleName) => ({
  role: roleName,
  region: getRegion(),
});

module.exports = function createConfigFile(src, roleName) {
  const configStr = JSON.stringify(config(roleName));
  fs.writeFileSync(`${src}/bam/config.json`, configStr);

  console.log('config file created');
};
