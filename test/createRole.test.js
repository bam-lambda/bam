const { promisify } = require('util');
const AWS = require('aws-sdk');

const {
  promisifiedRimraf,
  createDirectory,
  createJSONFile,
  readConfig,
  writeConfig,
} = require('../src/util/fileUtils');

const { doesRoleExist, doesPolicyExist } = require('../src/aws/doesResourceExist.js');
const createRoles = require('../src/aws/createRoles.js');
const configTemplate = require('../templates/configTemplate.js');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const policyName = 'AWSLambdaBasicExecutionRole';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const path = './test';

describe('createRoles', async () => {
  beforeEach(async () => {
    jest.setTimeout(10000);
    await createDirectory('.bam', path);
    const config = await configTemplate(roleName);
    await createJSONFile('config', `${path}/.bam`, config);
  });

  afterEach(async () => {
    await promisifiedRimraf(`${path}/.bam`);
  });

  test('defaultRole is not created if user uses own role', async () => {
    const config = await readConfig(path);
    config.accountNumber = process.env.AWS_ID;
    config.role = 'otherTestRole';
    await writeConfig(path, config);
    await createRoles(roleName, path);
    const role = await doesRoleExist(roleName);
    expect(role).toBe(false);
  });

  describe('aws integration', async () => {
    beforeEach(async () => {
      const config = await readConfig(path);
      config.accountNumber = process.env.AWS_ID;
      await writeConfig(path, config);
    });

    afterEach(async () => {
      await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
      await asyncDeleteRole({ RoleName: roleName });
    });

    test('testBamRole is created', async () => {
      let role = await doesRoleExist(roleName);
      expect(role).toBe(false);
      await createRoles(roleName, path);
      role = await doesRoleExist(roleName);
      expect(role).toBe(true);
    });

    test('testBamRole is not created if already exists', async () => {
      await createRoles(roleName, path);
      const result = await createRoles(roleName, path);
      expect(result).toBeUndefined();
    });

    test('defaultRole has a policy', async () => {
      await createRoles(roleName, path);
      const policy = await doesPolicyExist(roleName, policyName);
      expect(policy).toBe(true);
    });
  });
});
