const { promisify } = require('util');
const https = require('https');
const AWS = require('aws-sdk');

const configTemplate = require('../templates/configTemplate');
const createRole = require('../src/aws/createRole');

const deployLambda = require('../src/aws/deployLambda.js');
const deployApi = require('../src/aws/deployApi.js');

const deleteLambda = require('../src/aws/deleteLambda');
const { doesApiExist } = require('../src/aws/doesResourceExist');
const deleteApi = require('../src/aws/deleteApi');
const delay = require('../src/util/delay.js');

const {
  writeFile,
  exists,
  unlink,
  readFile,
  readFuncLibrary,
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
} = require('../src/util/fileUtils');


const iam = new AWS.IAM();
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const stageName = 'test';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();

const asyncHttpsGet = endpoint => (
  new Promise((resolve) => {
    https.get(endpoint, resolve);
  })
);

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));

describe('bam deploy api', () => {
  beforeEach(async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    jest.setTimeout(60000);
    await createDirectory('.bam', path);
    await createDirectory('functions', `${path}/.bam/`);
    await createJSONFile('config', `${path}/.bam`, config);
    await createJSONFile('library', `${path}/.bam/functions`, {});
    await createRole(roleName, path);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
  });

  afterEach(async () => {
    const library = await readFuncLibrary(path);
    const { restApiId } = library[lambdaName].api;
    await deleteApi(restApiId, path);
    await deleteLambda(lambdaName, path);
    await promisifiedRimraf(`${path}/.bam`);
    await unlink(`${cwd}/${lambdaName}.js`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
    await delay(30000);
  });

  test('Response is 200 when hitting endpoint from library.json', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    let responseStatus;

    try {
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      console.log(err, err.stack);
    }

    expect(responseStatus).toEqual(200);
  });

  test('Api metadata exists within ./test/.bam/functions/library.json', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = await readFuncLibrary(path);
    const { api } = library[lambdaName];
    expect(api).toBeTruthy();
  });

  test('Api endpoint exists on AWS', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = await readFuncLibrary(path);
    const { restApiId } = library[lambdaName].api;
    const apiExists = await doesApiExist(restApiId);
    expect(apiExists).toBe(true);
  });

  test('Response contains query param in body', async () => {
    const testLambdaWithQueryParams = await readFile(`${path}/templates/testLambdaWithQueryParams.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithQueryParams);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = await readFuncLibrary(path);
    const url = `${library[lambdaName].api.endpoint}?name=John`;
    let responseBody;

    try {
      const response = await asyncHttpsGet(url);
      response.setEncoding('utf8');
      response.on('data', (data) => {
        console.log(data);
        responseBody = data;
        expect(responseBody).toMatch('John');
      });
    } catch (err) {
      console.log(err, err.stack);
    }
  });

  describe('lambda with dependencies', () => {
    beforeEach(async () => {
      const testLambdaWithDependencies = await readFile(`${path}/templates/testLambdaWithDependencies.js`);
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependencies);
      await deployLambda(lambdaName, 'test description', path);
      await deployApi(lambdaName, path, stageName);
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
        console.log(err, err.stack);
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
      await deployApi(lambdaName, path, stageName);
    });

    test('node modules directory does not contain modules listed after exports.handler', async () => {
      const moment = await exists(`${path}/.bam/functions/${lambdaName}/node_modules/moment`);
      expect(moment).toBe(false);
    });
  });
});
