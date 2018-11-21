const { promisify } = require('util');
const AWS = require('aws-sdk');
const fs = require('fs');
const rimraf = require('rimraf');

const createDirectory = require('../src/util/createDirectory.js');
const createJSONFile = require('../src/util/createJSONFile.js');
const { doesRoleExist, doesPolicyExist } = require('../src/aws/doesResourceExist.js');
const createRole = require('../src/aws/createRole.js');
const configTemplate = require('../templates/configTemplate.js');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const policyName = 'AWSLambdaBasicExecutionRole';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';

describe('createRole', () => {
  beforeEach(() => {
    createDirectory('.bam', 'test');
    const config = configTemplate(roleName);
    createJSONFile('config', `${path}/.bam`, config);
  });

  afterEach(async () => {
    try {
      await asyncRimRaf(`${path}/.bam`);
    } catch (err) {
      console.log(err);
    }
  });

  test('defaultRole is not created if user uses own role', async () => {
    const config = JSON.parse(fs.readFileSync(`${path}/.bam/config.json`, 'utf8'));
    config.accountNumber = process.env.AWS_ID;
    config.role = 'otherTestRole';
    fs.writeFileSync(`${path}/.bam/config.json`, JSON.stringify(config));
    await createRole(roleName, path);
    const role = await doesRoleExist(roleName);
    expect(role).toBe(false);
  });

  describe('aws integration', () => {
    beforeEach(() => {
      const config = JSON.parse(fs.readFileSync(`${path}/.bam/config.json`, 'utf8'));
      config.accountNumber = process.env.AWS_ID;
      fs.writeFileSync(`${path}/.bam/config.json`, JSON.stringify(config));
    });

    afterEach(async () => {
      await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
      await asyncDeleteRole({ RoleName: roleName });
    });

    test('testBamRole is created', async () => {
      let role = await doesRoleExist(roleName);
      expect(role).toBe(false);
      await createRole(roleName, path);
      role = await doesRoleExist(roleName);
      expect(role).toBe(true);
    });

    test('testBamRole is not created if exist', async () => {
      await createRole(roleName, path);
      const result = await createRole(roleName, path);
      expect(result).toBeUndefined();
    });

    test('defaultRole has a policy', async () => {
      await createRole(roleName, path);
      const policy = await doesPolicyExist(roleName, policyName);
      expect(policy).toBe(true);
    });
  });
});
