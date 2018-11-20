const fs = require('fs');
const rimraf = require('rimraf');

const createLambda = require('../src/aws/createLambda.js');
const createDirectory = require('../src/util/createDirectory');

const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';

describe('bam create lambda', () => {
  beforeEach(() => {
    createDirectory('.bam', path);
    createDirectory('functions', `${path}/.bam/`);
  });

  afterEach(async () => {
    try {
      await asyncRimRaf(`${path}/.bam`);
    } catch (err) {
      console.log(err);
    }
  });

  test('index.js exists within functions directory', () => {
    createLambda('testLambda', path);
    const template = fs.existsSync(`${path}/.bam/functions/testLambda/index.js`);
    expect(template).toBe(true);
  });
});
