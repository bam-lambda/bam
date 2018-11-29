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
const { createBamRole, createDatabaseBamRole } = require('../src/aws/createRoles.js');
const configTemplate = require('../templates/configTemplate.js');

const accountNumber = process.env.AWS_ID;
const iam = new AWS.IAM();
const roleName = 'testBamRole';
const databaseBamRole = 'testDatabaseBamRole';
const policyName = 'AWSLambdaBasicExecutionRole';
const databasePolicyARN = `arn:aws:iam::${accountNumber}:policy/testDatabaseBamRolePolicy`;
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const asyncDeletePolicy = promisify(iam.deletePolicy.bind(iam));
const path = './test';

describe('createBamRole', async () => {
  beforeEach(async () => {
    jest.setTimeout(10000);
    await createDirectory('.bam', path);
    const config = await configTemplate(roleName);
    await createJSONFile('config', `${path}/.bam`, config);
  });

  afterEach(async () => {
    await promisifiedRimraf(`${path}/.bam`);
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
      await createBamRole(roleName);
      role = await doesRoleExist(roleName);
      expect(role).toBe(true);
    });

    test('testBamRole is not created if already exists', async () => {
      await createBamRole(roleName);
      await createBamRole(roleName);
      const role = await doesRoleExist(roleName);
      expect(role).toBeTruthy();
    });

    test('defaultRole has a policy', async () => {
      await createBamRole(roleName);
      const policy = await doesPolicyExist(roleName, policyName);
      expect(policy).toBe(true);
    });
  });
});

describe('createDatabaseBamRole', () => {
  beforeEach(async () => {
    jest.setTimeout(10000);
    await createDirectory('.bam', path);
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    await createJSONFile('config', `${path}/.bam`, config);
    await writeConfig(path, config);
  });

  afterEach(async () => {
    await asyncDetachPolicy({ PolicyArn: databasePolicyARN, RoleName: databaseBamRole });
    await asyncDeletePolicy({ PolicyArn: databasePolicyARN });
    await asyncDeleteRole({ RoleName: databaseBamRole });
    await promisifiedRimraf(`${path}/.bam`);
  });

  test('databaseBamRole is created', async () => {
    let dbRole = await doesRoleExist(databaseBamRole);
    expect(dbRole).toBeFalsy();
    await createDatabaseBamRole(databaseBamRole, path);
    dbRole = await doesRoleExist(databaseBamRole);
    expect(dbRole).toBeTruthy();
  });
});
