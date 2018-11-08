const init = require('../init.js');
const { promisify } = require('util');
const createBamDirectory = require('../createBamDirectory.js');
const createConfigFile = require('../createConfigFile.js');
const fs = require('fs');
const doesTestRoleExist = require('../doesRoleExist.js');
const createRole = require('../createRole.js');

const AWS = require('aws-sdk');
const iam = new AWS.IAM();
const TestPolicyARN  = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));


describe('it inits', () => {
  beforeEach(() => {
    createBamDirectory('test');
    createConfigFile('test', 'testDefaultBamRole');
  });

  afterEach(async () => {
   fs.unlinkSync('./test/bam/config.json');
   fs.rmdirSync('./test/bam');
   await asyncDetachPolicy({ PolicyArn: TestPolicyARN, RoleName: 'testDefaultBamRole' });
   await asyncDeleteRole({ RoleName: 'testDefaultBamRole'});
  });

  test('bam directory has been created', () => {
    expect(fs.existsSync('./test/bam')).toBe(true);
  });

  test('bam directory contains config.json', () => {
    expect(fs.existsSync('./test/bam/config.json')).toBe(true);
  });

  test.only('testDefaultBamRole is created', async () => {
    // read from file, get json, insert env var id, write to file
    const config = JSON.parse(fs.readFileSync('./test/bam/config.json', 'utf8'));
    config.accountNumber = process.env.AWS_ID;
    fs.writeFileSync('./test/bam/config.json', JSON.stringify(config));

    expect(await doesTestRoleExist('testDefaultBamRole')).toBe(false);  
    await createRole('testDefaultBamRole', './test');
    expect(await doesTestRoleExist('testDefaultBamRole')).toBe(true);
  });

  test('defaultRole has correct region', () => {
    
  });

  test('defaultRole has a policy', () => {
    
  });

  test('defaultRole is not created if user uses own role', () => {
    
  });
});
