const fs = require('fs');
const init = require('../src/util/init.js');

const roleName = 'testDefaultBamRole';

describe('bam init', () => {
  beforeEach(() => {
    init(roleName, './test');
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
