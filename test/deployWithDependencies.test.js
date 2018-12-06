const https = require('https');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const configTemplate = require('../templates/configTemplate');
const { createBamRole } = require('../src/aws/createRoles');

const deployLambda = require('../src/aws/deployLambda.js');
const deployApi = require('../src/aws/deployApi.js');

const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay.js');

const { bamError } = require('../src/util/logger');

const {
  writeFile,
  exists,
  readFile,
  readFuncLibrary,
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
} = require('../src/util/fileUtils');


const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const path = './test';
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
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    jest.setTimeout(60000);
    await createDirectory('.bam', path);
    await createDirectory('functions', `${path}/.bam/`);
    await createJSONFile('config', `${path}/.bam`, config);
    await createJSONFile('library', `${path}/.bam/functions`, {});
    await createBamRole(roleName);
  });

  afterEach(async () => {
    await destroy(lambdaName, path);
    await promisifiedRimraf(`${path}/.bam`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
    await delay(30000);
  });

  describe('lambda with dependencies', () => {
    beforeEach(async () => {
      const testLambdaWithDependencies = await readFile(`${path}/templates/testLambdaWithDependencies.js`);
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependencies);
      await deployLambda(lambdaName, 'test description', path);
      await deployApi(lambdaName, path, httpMethods, stageName);
    });

    test('Response contains output from dependencies in body', async () => {
      const library = await readFuncLibrary(path);
      const url = library[lambdaName].api.endpoint;
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
      const packageJSONExists = await exists(`${path}/.bam/functions/${lambdaName}/package.json`);
      const packageLockJSONExists = await exists(`${path}/.bam/functions/${lambdaName}/package-lock.json`);
      expect(packageJSONExists).toBe(true);
      expect(packageLockJSONExists).toBe(true);
    });

    test('node modules directory is created', async () => {
      const nodeModulesDirExists = await exists(`${path}/.bam/functions/${lambdaName}/node_modules`);
      expect(nodeModulesDirExists).toBe(true);
    });

    test('node modules directory contains dependencies', async () => {
      const uuid = await exists(`${path}/.bam/functions/${lambdaName}/node_modules/uuid`);
      const moment = await exists(`${path}/.bam/functions/${lambdaName}/node_modules/moment`);
      expect(uuid).toBe(true);
      expect(moment).toBe(true);
    });

    test('node modules directory does not contain native node modules', async () => {
      const util = await exists(`${path}/.bam/functions/${lambdaName}/node_modules/util`);
      expect(util).toBe(false);
    });
  });

  describe('lambda with dependencies after exports.handler', () => {
    beforeEach(async () => {
      const testLambdaWithIncorrectDependencies = await readFile('./test/templates/testLambdaWithIncorrectDependencies.js');
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithIncorrectDependencies);
      await deployLambda(lambdaName, 'test description', path);
      await deployApi(lambdaName, path, httpMethods, stageName);
    });

    test('node modules directory does not contain modules listed after exports.handler', async () => {
      const moment = await exists(`${path}/.bam/functions/${lambdaName}/node_modules/moment`);
      expect(moment).toBe(false);
    });
  });
});
