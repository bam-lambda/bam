const { exists, promisifiedRimraf } = require('../src/util/fileUtils');

const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const bamError = require('../src/util/fancyText.js');

const roleName = 'testBamRole';
const path = './test';

describe('bam init', async () => {
  beforeEach(async () => {
    await setupBamDirAndFiles(roleName, './test');
  });

  afterEach(async () => {
    try {
      await promisifiedRimraf(`${path}/.bam`);
    } catch (err) {
      bamError(err);
    }
  });

  test('bam directory has been created', async () => {
    const bamDirExists = await exists('./test/.bam');
    expect(bamDirExists).toBe(true);
  });

  test('bam directory contains config.json', async () => {
    const configExists = await exists('./test/.bam/config.json');
    expect(configExists).toBe(true);
  });

  test('functions directory has been created', async () => {
    const functionsDirExists = await exists('./test/.bam/functions');
    expect(functionsDirExists).toBe(true);
  });

  test('functions directory contains library.json', async () => {
    const libraryExists = await exists('./test/.bam/functions/library.json');
    expect(libraryExists).toBe(true);
  });
});
