const fs = require('fs');

const createDirectory = require('../src/util/createDirectory.js');
const createJSONFile = require('../src/util/createJSONFile.js');
const configTemplate = require('../src/util/configTemplate.js');

const roleName = 'testDefaultBamRole';

describe('bam init', () => {
  beforeEach(() => {
    createDirectory('bam', 'test');
    const config = configTemplate(roleName);
    createJSONFile('config', './test/bam', config);
    createDirectory('functions', './test/bam');
    createJSONFile('library', './test/bam/functions', {});
  });

  afterEach(() => {
    fs.unlinkSync('./test/bam/config.json');
    fs.unlinkSync('./test/bam/functions/library.json');
    fs.rmdirSync('./test/bam/functions');
    fs.rmdirSync('./test/bam');
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
