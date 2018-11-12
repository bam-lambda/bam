/* global test, expect, describe, beforeEach, afterEach */
const fs = require('fs');

const createLambda = require('../src/commands/createLambda.js');
const createDirectory = require('../src/util/createDirectory');

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
    const template = fs.existsSync('./test/bam/functions/testLambda/index.js');
    expect(template).toBe(true);
  });
});
