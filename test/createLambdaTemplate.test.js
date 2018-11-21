const fs = require('fs');

const create = require('../src/commands/create.js');

const path = './test';
const cwd = process.cwd();
const lambdaName = 'testLambda';

describe('bam create lambda', () => {
  afterEach(() => fs.unlinkSync(`${cwd}/${lambdaName}.js`));

  test('index.js exists within functions directory', () => {
    create(lambdaName, path);
    const template = fs.existsSync(`${cwd}/${lambdaName}.js`);
    expect(template).toBe(true);
  });
});
