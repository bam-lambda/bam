const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const createRole = require('./createRole.js');
const AWS = require('aws-sdk');

const iam = new AWS.IAM();


module.exports = async () => {
  const config = JSON.parse(fs.readFileSync('./bam/config.json', 'utf8'));
  const defaultRole = config.role;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const asyncQuestion = (prompt, defaultValue) => (
    new Promise((resolve, reject) => {
      rl.question(prompt, resolve);
      rl.write(defaultValue);
    })
  );

  const getUserDefaults = async () => {
    try {
      config.accountNumber = await asyncQuestion('Please provide your AWS account number: ', '');
      config.region = await asyncQuestion('Please provide your default region: ', config.region);
      config.role = await asyncQuestion('Please provide your default role (if you do not provide one, one will be created for you): ', defaultRole);  
      rl.close();
    } catch (err) {
      console.log(err, err.stack);
    }
  };

  const writeConfig = () => {
    const configStr = JSON.stringify(config);
    fs.writeFileSync('./bam/config.json', configStr);
  };

  await getUserDefaults();
  writeConfig();
  await createRole(defaultRole, '.');
  console.log('success: config file complete');
};
