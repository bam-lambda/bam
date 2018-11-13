#!/usr/bin/env node
const fs = require('fs');
const createLambda = require('../src/commands/createLambda.js');
const init = require('../src/commands/init.js');
const createDirectory = require('../src/util/createDirectory.js');
const createJSONFile = require('../src/util/createJSONFile.js');
const configTemplate = require('../src/util/configTemplate.js');
const deployLambda = require('../src/commands/deployLambda.js');
const asyncQuestion = require('../src/util/asyncQuestion.js');
const deployApi = require('../src/commands/deployApi.js');

const defaultRole = 'defaultBamRole';
const configJSON = configTemplate(defaultRole);
const [,, command, lambdaName] = process.argv;

(async () => {
  if (command === 'create') {
    if (!fs.existsSync('./bam')) {
      createDirectory('bam', '.');
      createDirectory('functions', './bam');
      createJSONFile('config', './bam', configJSON);
      createJSONFile('library', './bam/functions', {});
      await init();
    }
    createLambda(lambdaName, '.');
  } else if (command === 'deploy') {
    const description = await asyncQuestion('Please give a brief description of your lambda: ', '');
    await deployLambda(lambdaName, description, '.');
    deployApi(lambdaName, '.');
  } else {

  }
})();
