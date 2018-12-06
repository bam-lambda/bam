const https = require('https');

const { bamError } = require('../src/util/logger');
const { createBamRole } = require('../src/aws/createRoles');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const redeploy = require('../src/commands/redeploy');
const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const { asyncGetRegion } = require('../src/util/getRegion');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const {
  promisifiedRimraf,
  unlink,
  readFile,
  writeFile,
  readConfig,
  writeConfig,
  writeLambda,
  readApisLibrary,
  getBamPath,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const bamPath = getBamPath(path);
const cwd = process.cwd();
const stageName = 'bam';
const httpMethods = ['GET'];

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
    jest.setTimeout(200000);
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await setupBamDirAndFiles(roleName, path);
    const config = await readConfig(path);
    config.accountNumber = process.env.AWS_ID;
    await writeConfig(path, config);
    await createBamRole(roleName);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
  });

  afterEach(async () => {
    await destroy(lambdaName, path);
    await promisifiedRimraf(bamPath);
    await unlink(`${cwd}/${lambdaName}.js`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('Response still 200 from same url after changing lambda', async () => {
    const region = await asyncGetRegion();
    const data = await deployLambda(lambdaName, 'test description', path);
    await writeLambda(data, path, 'test description');
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
    let responseStatus;

    const testLambdaWithDependenciesFile = await readFile('./test/templates/testLambdaWithDependencies.js');

    try {
      await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
      await redeploy(lambdaName, path, {});
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      bamError(err);
    }

    expect(responseStatus).toEqual(200);
  });

  test('Response contains different body before and after redeployment', async () => {
    const region = await asyncGetRegion();
    const data = await deployLambda(lambdaName, 'test description', path);
    await writeLambda(data, path, 'test description');
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
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
      await redeploy(lambdaName, path, {});

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

  test('Different requests return corresponding status codes', async () => {
    const region = await asyncGetRegion();
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await redeploy(lambdaName, path, { methods: ['POST', 'PUT', 'DELETE'] });

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
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

    const deleteOptions = {
      hostname: urlParts[0],
      path: `/${urlParts.slice(1).join('/')}`,
      method: 'DELETE',
    };

    let responsePost;
    let responsePut;
    let responseGet;
    let responseDelete;
    try {
      await delay(60000);
      responseGet = await asyncHttpsGet(url);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);
    } catch (err) {
      bamError(err);
    }

    expect(responseGet.statusCode).toBe(200);
    expect(responsePut.statusCode).toBe(200);
    expect(responsePost.statusCode).toBe(201);
    expect(responseDelete.statusCode).toBe(204);
  });

  test('httpMethod ANY supports all method types', async () => {
    const region = await asyncGetRegion();
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await redeploy(lambdaName, path, { methods: ['ANY'] });

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
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

    const deleteOptions = {
      hostname: urlParts[0],
      path: `/${urlParts.slice(1).join('/')}`,
      method: 'DELETE',
    };

    let responsePost;
    let responsePut;
    let responseGet;
    let responseDelete;
    try {
      await delay(60000);
      responseGet = await asyncHttpsGet(url);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);
    } catch (err) {
      bamError(err);
    }

    expect(responseGet.statusCode).toBe(200);
    expect(responsePut.statusCode).toBe(200);
    expect(responsePost.statusCode).toBe(201);
    expect(responseDelete.statusCode).toBe(204);
  });
});
