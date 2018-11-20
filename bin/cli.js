#!/usr/bin/env node
const fs = require('fs');

const createLambda = require('../src/aws/createLambda.js');
const getUserDefaults = require('../src/util/getUserDefaults.js');
const init = require('../src/util/init.js');
const createRole = require('../src/aws/createRole.js');
const deployLambda = require('../src/aws/deployLambda.js');
const getUserInput = require('../src/util/getUserInput.js');
const deployApi = require('../src/aws/deployApi.js');
const {
  resetStyledText,
  setBrightGreenText,
  brightGreenBam,
} = require('../src/util/fancyText.js');

const defaultRole = 'defaultBamRole';
const [,, command, lambdaName] = process.argv;

(async () => {
  resetStyledText();
  setBrightGreenText();

  if (command === 'create') {
    if (!fs.existsSync('./bam')) {
      init(defaultRole);
      await getUserDefaults();
      await createRole(defaultRole);
    }
    createLambda(lambdaName);
  } else if (command === 'deploy') {
    const question = {
      question: 'Please give a brief description of your lambda: ',
      validator: () => (true),
      feedback: 'invalid description',
      defaultAnswer: '',
    };
    const [description] = await getUserInput([question]);
    await deployLambda(lambdaName, description);
    await deployApi(lambdaName);
    brightGreenBam();
  } else {
    console.log(`Command: ${command} is not valid.`);
  }
})();
