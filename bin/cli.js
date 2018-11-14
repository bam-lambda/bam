#!/usr/bin/env node
const fs = require('fs');
const createLambda = require('../src/commands/createLambda.js');
const getUserDefaults = require('../src/commands/getUserDefaults.js');
const init = require('../src/util/init.js');
const createRole = require('../src/util/createRole.js');
const deployLambda = require('../src/commands/deployLambda.js');
const asyncQuestion = require('../src/util/asyncQuestion.js');
const deployApi = require('../src/commands/deployApi.js');

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
    const description = await asyncQuestion('Please give a brief description of your lambda: ', '');
    await deployLambda(lambdaName, description, '.');
    deployApi(lambdaName, '.');
  } else {

  }
})();
