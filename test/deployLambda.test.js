const { promisify } = require('util');
const fs = require('fs');
const AWS = require('aws-sdk');

const createLambda = require('../src/commands/createLambda.js');
const createDirectory = require('../src/util/createDirectory');
const deployLambda = require('../src/commands/deployLambda.js');
const createJSONFile = require('../src/util/createJSONFile');
const deleteLambda = require('../src/commands/deleteLambda');
const configTemplate = require('../src/util/configTemplate');
const createRole = require('../src/util/createRole');
const { doesLambdaExist } = require('../src/util/doesResourceExist');

const iam = new AWS.IAM();
const roleName = 'testDefaultBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const config = configTemplate(roleName);
config.accountNumber = process.env.AWS_ID;

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));

describe('bam create lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(15000);
    createDirectory('bam', './test');
    createDirectory('functions', './test/bam/');
    createJSONFile('config', './test/bam', config);
    createJSONFile('library', './test/bam/functions', {});
    await createRole(roleName, './test');
    createLambda(lambdaName, './test');
    await deployLambda(lambdaName, 'test description', './test');
  });

  afterEach(async () => {
    await deleteLambda(lambdaName, './test');
    fs.unlinkSync('./test/bam/functions/library.json');
    fs.rmdirSync('./test/bam/functions');
    fs.unlinkSync('./test/bam/config.json');
    fs.rmdirSync('./test/bam');
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('Zip file exists within ./test/bam/functions/{lambdaName}', () => {
    const template = fs.existsSync(`./test/bam/functions/${lambdaName}/${lambdaName}.zip`);
    expect(template).toBe(true);
  });

  test('Lambda exists on AWS', async () => {
    const lambda = await doesLambdaExist(lambdaName);
    expect(lambda).toBe(true);
  });

  test('Lambda metadata exists within ./test/bam/functions/library.json', () => {
    const library = JSON.parse(fs.readFileSync('./test/bam/functions/library.json'));
    const lambda = library[lambdaName];
    expect(lambda).toBeTruthy();
  });
});
