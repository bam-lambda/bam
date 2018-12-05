const { readConfig, writeConfig } = require('./fileUtils');
const getUserInput = require('./getUserInput');

const { doesRoleExist } = require('../aws/doesResourceExist');

const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'sa-east-1'];

const badNum = 'Account number must have 12 numerical digits';
const badRegion = `Region must be one of the following:\n${regions.join('\n')}`;
const badRole = 'The role name you supplied is not registered to the account provided';

const validNum = r => /^[0-9]{12}$/.test(r);
const validRegion = r => regions.includes(r);

module.exports = async function getUserDefaults(path) {
  const config = await readConfig(path);
  const defaultRole = config.role;
  const validRole = userRole => userRole === defaultRole || doesRoleExist(userRole);

  const getUserInputs = async () => {
    const getAccountNumber = {
      question: 'Please provide your AWS account number: ',
      validator: validNum,
      feedback: badNum,
      defaultAnswer: process.env.AWS_ID,
    };

    const getUserRegion = {
      question: 'Please provide your default region: ',
      validator: validRegion,
      feedback: badRegion,
      defaultAnswer: config.region,
    };

    const getRole = {
      question: 'Please provide your default role (if you do not provide a role, one will be created for you): ',
      validator: validRole,
      feedback: badRole,
      defaultAnswer: defaultRole,
    };

    const configPrompts = [getAccountNumber, getUserRegion, getRole];

    const userDefaults = await getUserInput(configPrompts); // undefined if user quits prompts
    if (userDefaults) [config.accountNumber, config.region, config.role] = userDefaults;
    return userDefaults;
  };

  const inputs = await getUserInputs();
  await writeConfig(path, config);
  return !!inputs; // inputs completely received (user did not quit early)
};
