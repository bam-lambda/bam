const { readConfig, writeConfig } = require('./fileUtils');
const getUserInput = require('./getUserInput');
const { doesRoleExist } = require('../aws/doesResourceExist');

const badNum = 'Account number must have 12 numerical digits';
const badRole = 'Role does not exist';
const validNum = r => /^[0-9]{12}$/.test(r);

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

    const getRole = {
      question: 'Please provide the name of the role BAM! should use by default (if you do not provide a role, one will be created for you): ',
      validator: validRole,
      feedback: badRole,
      defaultAnswer: defaultRole,
    };

    const configPrompts = [getAccountNumber, getRole];

    const userDefaults = await getUserInput(configPrompts); // undefined if user quits prompts
    if (userDefaults) [config.accountNumber, config.role] = userDefaults;
    return userDefaults;
  };

  const inputs = await getUserInputs();
  await writeConfig(path, config);
  return !!inputs; // inputs completely received (user did not quit early)
};
