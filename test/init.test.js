// TODO: move to cli.js test
//  TODO: add test for creating functions directory
//  TODO: add test for library.json creation

const { promisify } = require('util');
const AWS = require('aws-sdk');
const fs = require('fs');

const createDirectory = require('../createDirectory.js');
const createJSONFile = require('../createJSONFile.js');
const { doesRoleExist, doesPolicyExist } = require('../doesResourceExist.js');
const createRole = require('../createRole.js');
const configTemplate = require('../configTemplate.js');

const iam = new AWS.IAM();
const roleName = 'testDefaultBamRole';
const policyName = 'AWSLambdaBasicExecutionRole';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));

describe('bam init', () => {
  beforeEach(() => {
    createDirectory('bam', 'test');
    const config = configTemplate(roleName);
    createJSONFile('config', './test/bam', config);
  });

  afterEach(() => {
    fs.unlinkSync('./test/bam/config.json');
    fs.rmdirSync('./test/bam');
  });

  test('bam directory has been created', () => {
    expect(fs.existsSync('./test/bam')).toBe(true);
  });

  test('bam directory contains config.json', () => {
    expect(fs.existsSync('./test/bam/config.json')).toBe(true);
  });

  test('defaultRole is not created if user uses own role', async () => {
    const config = JSON.parse(fs.readFileSync('./test/bam/config.json', 'utf8'));
    config.accountNumber = process.env.AWS_ID;
    config.role = 'otherTestRole';
    fs.writeFileSync('./test/bam/config.json', JSON.stringify(config));
    await createRole(roleName, './test');
    const role = await doesRoleExist(roleName);
    expect(role).toBe(false);
  });

  describe('aws integration', () => {
    beforeEach(() => {
      const config = JSON.parse(fs.readFileSync('./test/bam/config.json', 'utf8'));
      config.accountNumber = process.env.AWS_ID;
      fs.writeFileSync('./test/bam/config.json', JSON.stringify(config));
    });

    afterEach(async () => {
      await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
      await asyncDeleteRole({ RoleName: roleName });
    });

    test('testDefaultBamRole is created', async () => {
      let role = await doesRoleExist(roleName);
      expect(role).toBe(false);
      await createRole(roleName, './test');
      role = await doesRoleExist(roleName);
      expect(role).toBe(true);
    });

    test('testDefaultBamRole is not created if exist', async () => {
      await createRole(roleName, './test');
      const result = await createRole(roleName, './test');
      expect(result).toBeUndefined();
    });

    test('defaultRole has a policy', async () => {
      await createRole(roleName, './test');
      const policy = await doesPolicyExist(roleName, policyName);
      expect(policy).toBe(true);
    });
  });
});
