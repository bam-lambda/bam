const createLambda = require('../createLambda.js');
const createDirectory = require('../createDirectory');
const fs = require('fs');

describe('bam create lambda', () => {
  beforeEach(() => {
    createDirectory('bam', './test');
    createDirectory('functions', './test/bam/');
  });

  afterEach(() => {
   fs.unlinkSync('./test/bam/functions/testLambda/index.js');
   fs.rmdirSync('./test/bam/functions/testLambda');
   fs.rmdirSync('./test/bam/functions');
   fs.rmdirSync('./test/bam');
  });

  test('index.js exists within functions directory', () => {
    createLambda('testLambda', './test');
    const template = fs.existsSync('./test/bam/functions/testLambda/index.js')
    expect(template).toBe(true);
  });
});
