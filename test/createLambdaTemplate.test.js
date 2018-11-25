const { exists, unlink } = require('../src/util/fileUtils');
const create = require('../src/commands/create');

const path = './test';
const cwd = process.cwd();
const lambdaName = 'testBamLambda';

describe('bam create lambda', async () => {
  test('testBamLambda.js file exists within current directory', async () => {
    await create(lambdaName, path);
    const template = await exists(`${cwd}/${lambdaName}.js`);
    expect(template).toBe(true);
    await unlink(`${cwd}/${lambdaName}.js`);
  });

  test('file is not created when name is too long', async () => {
    const longLambdaName = 'ffdasfkkajflajfkljdfkljakfljdkfljaklfjklafjklsjfkaljfkajfkdsjfklajf';
    await create(longLambdaName, path);
    const template = await exists(`${cwd}/${longLambdaName}.js`);
    expect(template).toBe(false);
  });

  test('file is not created when name contains illegal AWS characters', async () => {
    const nameWithIllegalChars = 'serverlessIs#1!';
    await create(nameWithIllegalChars, path);
    const template = await exists(`${cwd}/${nameWithIllegalChars}.js`);
    expect(template).toBe(false);
  });
});
