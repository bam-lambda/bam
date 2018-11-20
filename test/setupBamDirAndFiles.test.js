const fs = require('fs');
const rimraf = require('rimraf');

const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const bamError = require('../src/util/fancyText.js');

const roleName = 'testBamRole';
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';

describe('bam init', () => {
  beforeEach(() => {
    setupBamDirAndFiles(roleName, './test');
  });

  afterEach(async () => {
    try {
      await asyncRimRaf(`${path}/.bam`);
    } catch (err) {
      bamError(err);
    }
  });

  test('bam directory has been created', () => {
    expect(fs.existsSync('./test/.bam')).toBe(true);
  });

  test('bam directory contains config.json', () => {
    expect(fs.existsSync('./test/.bam/config.json')).toBe(true);
  });

  test('functions directory has been created', () => {
    expect(fs.existsSync('./test/.bam/functions')).toBe(true);
  });

  test('functions directory contains library.json', () => {
    expect(fs.existsSync('./test/.bam/functions/library.json')).toBe(true);
  });
});
