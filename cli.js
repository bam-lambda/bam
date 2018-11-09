#!/usr/bin/env node
const [,, ...args] = process.argv;
const createLambda = require('./createLambda.js');
const init = require('./init.js');
const createDirectory = require('./createDirectory.js');
const createJSONFile = require('./createJSONFile.js');
const configTemplate = require('./configTemplate.js');
const deployLambda = require('./deployLambda.js');

const defaultRole = 'defaultBamRole';
const configJSON = configTemplate(defaultRole);

if (args[0] === 'init') {
  createDirectory('bam', '.');
  createDirectory('functions', './bam');
  createJSONFile('config', './bam', configJSON);
  createJSONFile('library', './bam/functions', {});
  init();
} else if (args.slice(0, 2).join(' ') === 'create lambda') {
  createLambda(args[2], '.');
} else if (args.slice(0, 2).join(' ') === 'deploy lambda') {
  deployLambda(args[2], '.');
} else {

}
