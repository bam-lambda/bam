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
    const question = {
      question: 'Please give a brief description of your lambda: ',
      validator: () => (true),
      feedback: 'invalid description',
      defaultAnswer: ''
    };
    const [description] = await getUserInput([question]);
    await deployLambda(lambdaName, description);
    deployApi(lambdaName);

  } else {
    console.log(`Command: ${command} is not valid.`);
  }
})();
