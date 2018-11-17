const fs = require('fs');
const rimraf = require('rimraf');

const init = require('../src/util/init.js');

const roleName = 'testDefaultBamRole';
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';

describe('bam init', () => {
  beforeEach(() => {
    init(roleName, './test');
  });

  afterEach(async () => {
    try {
      await asyncRimRaf(`${path}/bam`);
    } catch (err) {
      console.log(err);
    }
  });

  test('bam directory has been created', () => {
    expect(fs.existsSync('./test/bam')).toBe(true);
  });

  test('bam directory contains config.json', () => {
    expect(fs.existsSync('./test/bam/config.json')).toBe(true);
  });

  test('functions directory has been created', () => {
    expect(fs.existsSync('./test/bam/functions')).toBe(true);
  });

  test('functions directory contains library.json', () => {
    expect(fs.existsSync('./test/bam/functions/library.json')).toBe(true);
  });
});
