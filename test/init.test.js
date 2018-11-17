const fs = require('fs');
const rimraf = require('rimraf');

const createDirectory = require('../src/util/createDirectory.js');
const createJSONFile = require('../src/util/createJSONFile.js');
const configTemplate = require('../templates/configTemplate.js');

const roleName = 'testDefaultBamRole';
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';

describe('bam init', () => {
  beforeEach(() => {
    createDirectory('bam', 'test');
    const config = configTemplate(roleName);
    createJSONFile('config', './test/bam', config);
    createDirectory('functions', './test/bam');
    createJSONFile('library', './test/bam/functions', {});
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
