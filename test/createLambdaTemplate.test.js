const { exists, unlink } = require('../src/util/fileUtils.js');
const create = require('../src/commands/create.js');

const path = './test';
const cwd = process.cwd();
const lambdaName = 'testLambda';

describe('bam create lambda', async () => {
  afterEach(async () => {
    await unlink(`${cwd}/${lambdaName}.js`);
  });

  test('index.js exists within functions directory', async () => {
    await create(lambdaName, path);
    const template = await exists(`${cwd}/${lambdaName}.js`);
    expect(template).toBe(true);
  });
});
