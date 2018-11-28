const https = require('https');
const AWS = require('aws-sdk');

const { promisify } = require('util');
const {
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
  exists,
  readFile,
  writeFile,
  writeLambda,
  readFuncLibrary,
  unlink,
} = require('../src/util/fileUtils');
const configTemplate = require('../templates/configTemplate');
const createRole = require('../src/aws/createRole');

const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');

const updateLambda = require('../src/aws/updateLambda');
const redeploy = require('../src/commands/redeploy');

const deleteLambda = require('../src/aws/deleteLambda');
const deleteApi = require('../src/aws/deleteApi');
const delay = require('../src/util/delay');
const { bamError } = require('../src/util/logger');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();
const stageName = 'bamTest';
const httpMethods = ['GET'];

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));

const asyncHttpsGet = endpoint => (
  new Promise((resolve) => {
    https.get(endpoint, resolve);
  })
);

const asyncHttpsRequest = opts => (
  new Promise((resolve, reject) => {
    const request = https.request(opts, (response) => {
      resolve(response);
    });

    request.on('error,', (err) => {
      reject(err);
    });

    request.end();
  })
);

describe('bam redeploy lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(60000);
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
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
    delay(30000);
  });

  test('Response still 200 from same url after changing lambda', async () => {
    const data = await deployLambda(lambdaName, 'test description', path);
    await writeLambda(data, path, 'test description');
    await deployApi(lambdaName, path, httpMethods, stageName);

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    let responseStatus;

    const testLambdaWithDependenciesFile = await readFile('./test/templates/testLambdaWithDependencies.js');

    try {
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
      await updateLambda(lambdaName, path);
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      bamError(err);
    }

    expect(responseStatus).toEqual(200);
  });

  test('Response contains different body before and after redeployment', async () => {
    const data = await deployLambda(lambdaName, 'test description', path);
    await writeLambda(data, path, 'test description');
    await deployApi(lambdaName, path, httpMethods, stageName);

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    let responseBody;

    try {
      const preResponse = await asyncHttpsGet(url);
      preResponse.setEncoding('utf8');
      preResponse.on('data', (response) => {
        responseBody = response;
        expect(responseBody).toMatch('<h1>This is a test</h1>');
      });

      const testLambdaWithDependenciesFile = await readFile('./test/templates/testLambdaWithDependencies.js');
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
      await updateLambda(lambdaName, path);

      const postResponse = await asyncHttpsGet(url);
      postResponse.setEncoding('utf8');
      postResponse.on('data', (response) => {
        responseBody = response;
        expect(responseBody).toMatch('uuid');
        expect(responseBody).toMatch('2016-12');
        expect(responseBody).toMatch('cool');
      });
    } catch (err) {
      bamError(err);
    }
  });

  test('Local node modules exist for dependencies only post redeployment', async () => {
    const data = await deployLambda(lambdaName, 'test description', path);
    await writeLambda(data, path, 'test description');
    await deployApi(lambdaName, path, httpMethods, stageName);

    let nodeModules = await exists(`${path}/.bam/functions/${lambdaName}/node_modules`);
    expect(nodeModules).toBe(false);

    const testLambdaWithDependenciesFile = await readFile('./test/templates/testLambdaWithDependencies.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
    await redeploy(lambdaName, path);

    nodeModules = await exists(`${path}/.bam/functions/${lambdaName}/node_modules`);
    expect(nodeModules).toBe(true);
  });

  test.skip('POST and PUT requests return 201 status code', async () => {
    const testLambdaForPostMethod = await readFile(`${path}/templates/testLambdaForPostMethod.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaForPostMethod);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await redeploy(lambdaName, path, { methods: ['POST', 'PUT'] });

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    const urlParts = url.split('//')[1].split('/');
    const postOptions = {
      hostname: urlParts[0],
      path: `/${urlParts.slice(1).join('/')}`,
      method: 'POST',
    };

    const putOptions = {
      hostname: urlParts[0],
      path: `/${urlParts.slice(1).join('/')}`,
      method: 'PUT',
    };

    let responsePost;
    let responsePut;
    try {
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
    } catch (err) {
      bamError(err);
    }

    expect(responsePost.statusCode).toBe(201);
    expect(responsePut.statusCode).toBe(201);
  });
});
