#!/usr/bin/env node
const [,, ...args] = process.argv;
const createLambda = require('./createLambda.js');
const init = require('./init.js');
const createDirectory = require('./createDirectory.js');
const createConfigFile = require('./createConfigFile.js');
const fs = require('fs');

if (args[0] === 'init') {
  createDirectory('bam', '.');
  createDirectory('functions', './bam');
  createConfigFile('.', 'defaultBamRole');
  init();
} else if (args.slice(0, 2).join(' ') === 'create lambda') {
  createLambda(args[2], '.');
} else {

}
