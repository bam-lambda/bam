#!/usr/bin/env node
const [,, ...args] = process.argv;
const createLambda = require('./createLambda.js');
const init = require('./init.js');
const createBamDirectory = require('./createBamDirectory.js');
const createConfigFile = require('./createConfigFile.js');
const fs = require('fs');

if (args[0] === 'init') {
  createBamDirectory();
  console.log('bam directory created');
  createConfigFile();
  console.log('config file created');
  const config = fs.readFileSync('./bam/config.json', 'utf8');
  // console.log(config);

  init();
} else if (args.slice(0, 2).join(' ') === 'create lambda') {
  createLambda(args[2]);
} else {

}
