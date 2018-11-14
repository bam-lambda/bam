#!/usr/bin/env node
const fs = require('fs');
const createLambda = require('../src/aws/createLambda.js');
const getUserDefaults = require('../src/util/getUserDefaults.js');
const init = require('../src/util/init.js');
const createRole = require('../src/aws/createRole.js');
const deployLambda = require('../src/aws/deployLambda.js');
const getUserInput = require('../src/util/getUserInput.js');
const deployApi = require('../src/aws/deployApi.js');

const defaultRole = 'defaultBamRole';
const [,, command, lambdaName] = process.argv;

(async () => {
  if (command === 'create') {
    if (!fs.existsSync('./bam')) {
      await init();
      await createRole(defaultRole, '.');
      await getUserDefaults();
    }
    createLambda(lambdaName, '.');
  } else if (command === 'deploy') {
    const description = await getUserInput('Please give a brief description of your lambda: ', '');
    await deployLambda(lambdaName, description, '.');
    deployApi(lambdaName, '.');
  } else {

  }
})();
