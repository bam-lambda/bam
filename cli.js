#!/usr/bin/env node
const [,, ...args] = process.argv;
const createLambda = require('./createLambda.js');
const init = require('./init.js');

if (args[0] === 'init') {
  init();
} else if (args.slice(0, 2).join(' ') === 'create lambda') {
  createLambda(args[2]);
} else {

}
