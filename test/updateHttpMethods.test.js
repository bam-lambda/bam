const https = require('https');

const { bamError } = require('../src/util/logger');
const { createBamRole } = require('../src/aws/createRoles');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const redeploy = require('../src/commands/redeploy');
const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');

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
  getBamPath,
  writeLambda,
  writeApi,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const lambdaDescription = 'test description';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
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
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName }); 
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('specified httpMethods are created when api is deployed', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    const specifiedMethods = ['PUT', 'DELETE'];
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, specifiedMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, specifiedMethods, lambdaName, restApiId, path);

    const urlParts = endpoint.split('//')[1].split('/');
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
      responseGet = await asyncHttpsGet(endpoint);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);
    } catch (err) {
      bamError(err);
    }

    expect(responseGet.statusCode).toBe(403);
    expect(responsePut.statusCode).toBe(200);
    expect(responsePost.statusCode).toBe(403);
    expect(responseDelete.statusCode).toBe(204);
  });

  test('httpMethods update upon redeploy', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
    const options = {
      methods: ['POST', 'POST', 'PUT', 'DELETE'],
      rmMethods: ['PUT', 'DELETE'],
    };
    await redeploy(lambdaName, path, options);

    const urlParts = endpoint.split('//')[1].split('/');
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
      responseGet = await asyncHttpsGet(endpoint);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);
    } catch (err) {
      bamError(err);
    }

    expect(responseGet.statusCode).toBe(200);
    expect(responsePut.statusCode).toBe(403);
    expect(responsePost.statusCode).toBe(201);
    expect(responseDelete.statusCode).toBe(403);
  });

  test('method "ANY" accepts all methods', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
    const addAny = { methods: ['ANY'] };
    const rmAny = { rmMethods: ['ANY'] };

    const urlParts = endpoint.split('//')[1].split('/');
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
      responseGet = await asyncHttpsGet(endpoint);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);

      expect(responseGet.statusCode).toBe(200);
      expect(responsePut.statusCode).toBe(403);
      expect(responsePost.statusCode).toBe(403);
      expect(responseDelete.statusCode).toBe(403);

      await redeploy(lambdaName, path, addAny);
      await delay(60000);
      responseGet = await asyncHttpsGet(endpoint);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);

      expect(responseGet.statusCode).toBe(200);
      expect(responsePut.statusCode).toBe(200);
      expect(responsePost.statusCode).toBe(201);
      expect(responseDelete.statusCode).toBe(204);

      await redeploy(lambdaName, path, rmAny);
      await delay(60000);
      responseGet = await asyncHttpsGet(endpoint);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);

      expect(responseGet.statusCode).toBe(200);
      expect(responsePut.statusCode).toBe(403);
      expect(responsePost.statusCode).toBe(403);
      expect(responseDelete.statusCode).toBe(403);
    } catch (err) {
      bamError(err);
    }
  });
});
