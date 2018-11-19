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
  brightGreenText,
  brightGreenBamCharByChar,
  resetColor,
} = require('../src/util/fancyText.js');

const defaultRole = 'defaultBamRole';
const [,, command, lambdaName] = process.argv;

(async () => {
  if (command === 'create') {
    if (!fs.existsSync('./bam')) {
      await brightGreenBamCharByChar();
      brightGreenText();
      await init(defaultRole);
      await createRole(defaultRole);
      await getUserDefaults();
    }
    brightGreenText();
    createLambda(lambdaName);
  } else if (command === 'deploy') {
    brightGreenText();
    const [description] = await getUserInput([['Please give a brief description of your lambda: ', '']]);
    // await displayGreenSpinningCursor(false);
    brightGreenText();
    await deployLambda(lambdaName, description);
    // await displayGreenSpinningCursor(false);
    brightGreenText();
    await deployApi(lambdaName);
  } else {
    brightGreenText();
    console.log(`Command: ${command} is not valid.`);
    resetColor();
  }
})();
