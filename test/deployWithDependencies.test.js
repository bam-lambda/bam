const https = require('https');

const { createBamRole } = require('../src/aws/createRoles');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay');
const { bamError } = require('../src/util/logger');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const { asyncGetRegion } = require('../src/util/getRegion');
const { writeLambda, writeApi } = require('../src/util/fileUtils');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const {
  writeFile,
  readConfig,
  writeConfig,
  unlink,
  exists,
  readFile,
  readApisLibrary,
  getStagingPath,
  promisifiedRimraf,
  getBamPath,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const lambdaDescription = 'test description';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const path = './test';
const bamPath = getBamPath(path);
const stagingPath = getStagingPath(path);
const cwd = process.cwd();
const stageName = 'bam';
const httpMethods = ['GET'];

const asyncHttpsGet = endpoint => (
  new Promise((resolve) => {
    https.get(endpoint, resolve);
  })
);

describe('bam deploy api', () => {
  beforeEach(async () => {
    jest.setTimeout(90000);
    await setupBamDirAndFiles(roleName, path);
    const config = await readConfig(path);
    config.accountNumber = process.env.AWS_ID;
    await writeConfig(path, config);
    await createBamRole(roleName);
  });

  afterEach(async () => {
    await destroy(lambdaName, path);
    await promisifiedRimraf(bamPath);
    await unlink(`${cwd}/${lambdaName}.js`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
    await delay(30000);
  });

  describe('lambda with dependencies', () => {
    beforeEach(async () => {
      const testLambdaWithDependencies = await readFile(`${path}/templates/testLambdaWithDependencies.js`);
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependencies);
      const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
      const {
        restApiId,
        endpoint,
        methodPermissionIds,
      } = await deployApi(lambdaName, path, httpMethods, stageName);

      await writeLambda(lambdaData, path, lambdaDescription);
      await writeApi(endpoint, methodPermissionIds, lambdaName, restApiId, path);
    });

    test('Response contains output from dependencies in body', async () => {
      const region = await asyncGetRegion();
      const apis = await readApisLibrary(path);
      const url = apis[region][lambdaName].endpoint;
      let responseBody;

      try {
        const response = await asyncHttpsGet(url);
        response.setEncoding('utf8');
        response.on('data', (data) => {
          responseBody = data;
          expect(responseBody).toMatch('uuid');
          expect(responseBody).toMatch('2016-12');
          expect(responseBody).toMatch('cool');
        });
      } catch (err) {
        bamError(err);
      }
    });

    test('package.json file is created', async () => {
      const packageJSONExists = await exists(`${stagingPath}/${lambdaName}/package.json`);
      const packageLockJSONExists = await exists(`${stagingPath}/${lambdaName}/package-lock.json`);
      expect(packageJSONExists).toBe(true);
      expect(packageLockJSONExists).toBe(true);
    });

    test('node modules directory is created', async () => {
      const nodeModulesDirExists = await exists(`${stagingPath}/${lambdaName}/node_modules`);
      expect(nodeModulesDirExists).toBe(true);
    });

    test('node modules directory contains dependencies', async () => {
      const uuid = await exists(`${stagingPath}/${lambdaName}/node_modules/uuid`);
      const moment = await exists(`${stagingPath}/${lambdaName}/node_modules/moment`);
      expect(uuid).toBe(true);
      expect(moment).toBe(true);
    });

    test('node modules directory does not contain native node modules', async () => {
      const util = await exists(`${stagingPath}/${lambdaName}/node_modules/util`);
      expect(util).toBe(false);
    });
  });

  describe('lambda with dependencies after exports.handler', () => {
    beforeEach(async () => {
      const testLambdaWithIncorrectDependencies = await readFile('./test/templates/testLambdaWithIncorrectDependencies.js');
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithIncorrectDependencies);
      const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
      const {
        restApiId,
        endpoint,
        methodPermissionIds,
      } = await deployApi(lambdaName, path, httpMethods, stageName);

      await writeLambda(lambdaData, path, lambdaDescription);
      await writeApi(endpoint, methodPermissionIds, lambdaName, restApiId, path);
    });

    test('node modules directory does not contain modules listed after exports.handler', async () => {
      const moment = await exists(`${stagingPath}/${lambdaName}/node_modules/moment`);
      expect(moment).toBe(false);
    });
  });
});
