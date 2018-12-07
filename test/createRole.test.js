const {
  asyncDeleteRole,
  asyncDetachPolicy,
  asyncDeletePolicy,
} = require('../src/aws/awsFunctions');

const {
  promisifiedRimraf,
  createDirectory,
  createJSONFile,
  readConfig,
  writeConfig,
  getBamPath,
} = require('../src/util/fileUtils');

const { doesRoleExist, doesPolicyExist } = require('../src/aws/doesResourceExist.js');
const { createBamRole, createDatabaseBamRole } = require('../src/aws/createRoles.js');
const configTemplate = require('../templates/configTemplate.js');

const accountNumber = process.env.AWS_ID;
const roleName = 'testBamRole';
const databaseBamRole = 'testDatabaseBamRole';
const policyName = 'AWSLambdaBasicExecutionRole';
const databasePolicyARN = `arn:aws:iam::${accountNumber}:policy/testDatabaseBamRolePolicy`;
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const path = './test';
const bamPath = getBamPath(path);

describe('createBamRole', async () => {
  beforeEach(async () => {
    jest.setTimeout(15000);
    await createDirectory('.bam', path);
    const config = await configTemplate(roleName);
    await createJSONFile('config', bamPath, config);
  });

  afterEach(async () => {
    await promisifiedRimraf(bamPath);
  });

  describe('aws integration', async () => {
    beforeEach(async () => {
      const config = await readConfig(path);
      config.accountNumber = process.env.AWS_ID;
      await writeConfig(path, config);
    });

    afterEach(async () => {
      await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
      await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName });
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
      const policy = await doesPolicyExist(testPolicyARN);
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
    await createJSONFile('config', bamPath, config);
    await writeConfig(path, config);
  });

  afterEach(async () => {
    await asyncDetachPolicy({ PolicyArn: databasePolicyARN, RoleName: databaseBamRole });
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: databaseBamRole });
    await asyncDeletePolicy({ PolicyArn: databasePolicyARN });
    await asyncDeleteRole({ RoleName: databaseBamRole });
    await promisifiedRimraf(bamPath);
  });

  test('databaseBamRole is created', async () => {
    let dbRole = await doesRoleExist(databaseBamRole);
    expect(dbRole).toBeFalsy();
    await createDatabaseBamRole(databaseBamRole, path);
    dbRole = await doesRoleExist(databaseBamRole);
    expect(dbRole).toBeTruthy();
  });
});
