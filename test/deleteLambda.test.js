const { promisify } = require('util');
const fs = require('fs');
const AWS = require('aws-sdk');
const rimraf = require('rimraf');

const createDirectory = require('../src/util/createDirectory');
const deployLambda = require('../src/aws/deployLambda.js');
const createJSONFile = require('../src/util/createJSONFile');
const destroy = require('../src/commands/destroy');
const configTemplate = require('../templates/configTemplate');
const createRole = require('../src/aws/createRole');
const { doesLambdaExist } = require('../src/aws/doesResourceExist');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';
const config = configTemplate(roleName);
config.accountNumber = process.env.AWS_ID;
const testLambdaFile = fs.readFileSync('./test/templates/testLambda.js');

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const cwd = process.cwd();

describe('bam delete lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(25000);
    createDirectory('.bam', path);
    createDirectory('functions', `${path}/.bam/`);
    createJSONFile('config', `${path}/.bam/`, config);
    createJSONFile('library', `${path}/.bam/functions`, {});
    await createRole(roleName, path);
    fs.writeFileSync(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
  });

  afterEach(async () => {
    await asyncRimRaf(`${path}/.bam`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('Lambda directory does not exists within ./test/.bam/functions', async () => {
    let template = fs.existsSync(`${path}/.bam/functions/${lambdaName}`);
    expect(template).toBe(true);
    await destroy(lambdaName, path);
    template = fs.existsSync(`${path}/.bam/functions/${lambdaName}`);
    expect(template).toBe(false);
  });

  test('Lambda does not exists on AWS', async () => {
    let lambda = await doesLambdaExist(lambdaName);
    expect(lambda).toBe(true);
    await destroy(lambdaName, path);
    lambda = await doesLambdaExist(lambdaName);
    expect(lambda).toBe(false);
  });

  test('Lambda metadata is removed from ./test/.bam/functions/library.json', async () => {
    let library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
    let lambda = library[lambdaName];
    expect(lambda).toBeDefined();

    await destroy(lambdaName, path);

    library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
    lambda = library[lambdaName];
    expect(lambda).toBeUndefined();
  });
});
