const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const { homedir } = require('os');
const createRole = require('./createRole.js');
const AWS = require('aws-sdk');

const iam = new AWS.IAM();

const config = {};
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getRegion = () => {
  const configStr = fs.readFileSync(homedir() + '/.aws/config', 'utf8');
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  const region = regionLine.split('= ')[1];
  config.region = region;
};

const createAndMoveIntoBamDir = () => {
  const dir = './bam';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  process.chdir(dir);
};

const asyncQuestion = (prompt, defaultValue) => {
  return new Promise((resolve, reject) => {
    rl.question(prompt, resolve);
    rl.write(defaultValue);
  });
};

const getUserDefaults = async () => {
  try {
    config.accountNumber = await asyncQuestion('Please provide your AWS account number: ', '');
    config.region = await asyncQuestion('Please provide your default region: ', config.region);
    config.role = await asyncQuestion('Please provide your default role (if you do not provide one, one will be created for you): ', 'defaultBamRole');
    rl.close();
  } catch (err) {
    console.log(err, err.stack);
  }
};

const defaultBamRoleExists = async () => {
  const asyncGetRole = promisify(iam.getRole.bind(iam));

  try {
    await asyncGetRole({ RoleName: 'defaultBamRole' });
    console.log('defaultBamRole exists')
    return true;
  } catch (err) {
    return false;
  }
};

const writeConfig = async () => {
  const doesDefaultBamRoleExist = await defaultBamRoleExists();
  const configStr = JSON.stringify(config);
  fs.writeFileSync('config.json', configStr);
  if (config.role === 'defaultBamRole' && !doesDefaultBamRoleExist) {
    await createRole();
  }
};

module.exports = async () => {
  getRegion();
  createAndMoveIntoBamDir();
  await getUserDefaults();
  await writeConfig();
  console.log('success: config file complete');
};
