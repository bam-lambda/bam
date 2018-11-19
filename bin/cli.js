#!/usr/bin/env node
const fs = require('fs');
const createLambda = require('../src/aws/createLambda.js');
const getUserDefaults = require('../src/util/getUserDefaults.js');
const init = require('../src/util/init.js');
const createRole = require('../src/aws/createRole.js');
const deployLambda = require('../src/aws/deployLambda.js');
const getUserInput = require('../src/util/getUserInput.js');
const deployApi = require('../src/aws/deployApi.js');
const spinner = require('../src/util/spinner.js');

const defaultRole = 'defaultBamRole';
const [,, command, lambdaName] = process.argv;

(async () => {
  if (command === 'create') {
    if (!fs.existsSync('./bam')) {
      await init(defaultRole);
      await createRole(defaultRole);
      await getUserDefaults();
    }
    await spinner();
    createLambda(lambdaName);
  } else if (command === 'deploy') {
    const descriptionQuestion = 'Please give a brief description of your lambda: ';
    const whitelistedIpQuestion = 'Please enter an IP address to restrict access to or press enter if endpoint is public: ';
    const [description, whitelistedIp] = await getUserInput([[descriptionQuestion, ''], [whitelistedIpQuestion, '']]);
    // other validations?
    // allow for multiple ip addresses
    const trimmedWhitelistedIp = whitelistedIp.replace(/\s+/, '');
    await deployLambda(lambdaName, description);
    deployApi(lambdaName, trimmedWhitelistedIp);
  } else {
    console.log(`Command: ${command} is not valid.`);
  }
})();
