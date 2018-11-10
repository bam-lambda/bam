const createLambda = require('../createLambda.js');
const createDirectory = require('../createDirectory');
const deployLambda = require('../deployLambda.js');
const createJSONFile = require('../createJSONFile');
const deleteLambda = require('../deleteLambda');

const fs = require('fs');

describe('bam create lambda', () => {
  beforeEach(async () => {
    // setup directories, library
    createDirectory('bam', './test');
    createDirectory('functions', './test/bam/');
    createJSONFile('library', './test/bam/functions', {});
    // create testBamLambda.js
    createLambda('testBamLambda', './test');
    // deploy
    await deployLambda('testBamLambda', 'test description', './test');

    // see if zip file exists
    // see if lambda on AWS
    // see if property in library

  });

  afterEach(async () => {
   await deleteLambda('testBamLambda', './test');
   fs.unlinkSync('./test/bam/functions/library.json');
   fs.rmdirSync('./test/bam/functions');
   fs.rmdirSync('./test/bam');
  });

  test('testBamLambda.zip exists within ./test/bam/functions/testBamLambda', () => {
    const template = fs.existsSync('./test/bam/functions/testBamLambda/testBamLambda.zip');
    expect(template).toBe(true);
  });
});