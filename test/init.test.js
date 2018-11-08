const init = require('../init.js');
const createBamDirectory = require('../createBamDirectory.js');
const createConfigFile = require('../createConfigFile.js');
const fs = require('fs');

describe('it inits', () => {
  beforeEach(() => {
    createBamDirectory('test');
    createConfigFile('test', 'testDefaultBamRole');
  });

  afterEach(() => {
    // clearCityDatabase();
  });

  test('bam directory has been created', () => {
    expect(fs.existsSync('./test/bam')).toBeTruthy();
  });

  test('defaultRole is created', () => {
    
  });

  test('defaultRole has correct region', () => {
    
  });

  test('defaultRole has a policy', () => {
    
  });

  test('defaultRole is not created if user uses own role', () => {
    
  });
});
