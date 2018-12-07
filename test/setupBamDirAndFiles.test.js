const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const { bamError } = require('../src/util/logger');

const {
  exists,
  promisifiedRimraf,
  getStagingPath,
  getBamPath,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const path = './test';
const bamPath = getBamPath(path);

describe('bam init', async () => {
  beforeEach(async () => {
    await setupBamDirAndFiles(roleName, './test');
  });

  afterEach(async () => {
    try {
      await promisifiedRimraf(bamPath);
    } catch (err) {
      bamError(err);
    }
  });

  test('bam directory has been created', async () => {
    const bamDirExists = await exists(bamPath);
    expect(bamDirExists).toBe(true);
  });

  test('bam directory contains config.json', async () => {
    const configExists = await exists(`${bamPath}/config.json`);
    expect(configExists).toBe(true);
  });

  test('staging directory has been created', async () => {
    const stagingPath = getStagingPath(path);
    const stagingDirExists = await exists(stagingPath);
    expect(stagingDirExists).toBe(true);
  });

  test('bam directory contains lambdas.json', async () => {
    const lambdasExists = await exists(`${bamPath}/lambdas.json`);
    expect(lambdasExists).toBe(true);
  });
});
