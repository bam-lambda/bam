const https = require('https');
const AWS = require('aws-sdk');

const { promisify } = require('util');
const {
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
  readFile,
  writeFile,
  readFuncLibrary,
} = require('../src/util/fileUtils');
const { bamError } = require('../src/util/logger');
const configTemplate = require('../templates/configTemplate');
const { createBamRole } = require('../src/aws/createRoles');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const redeploy = require('../src/commands/redeploy');
const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay');

const iam = new AWS.IAM();
const accountNumber = process.env.AWS_ID;
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();
const stageName = 'bam';
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
    jest.setTimeout(200000);
    const config = await configTemplate(roleName);
    config.accountNumber = accountNumber;
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await createDirectory('.bam', path);
    await createDirectory('functions', `${path}/.bam/`);
    await createJSONFile('config', `${path}/.bam`, config);
    await createJSONFile('library', `${path}/.bam/functions`, {});
    await createBamRole(roleName);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
  });

  afterEach(async () => {
    await destroy(lambdaName, path);
    await promisifiedRimraf(`${path}/.bam`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('specified httpMethods are created when api is deployed', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    await deployLambda(lambdaName, 'test description', path);
    const specifiedMethods = ['PUT', 'DELETE'];
    await deployApi(lambdaName, path, specifiedMethods, stageName);

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

    expect(responseGet.statusCode).toBe(403);
    expect(responsePut.statusCode).toBe(200);
    expect(responsePost.statusCode).toBe(403);
    expect(responseDelete.statusCode).toBe(204);
  });

  test('httpMethods update upon redeploy', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    const options = {
      methods: ['POST', 'POST', 'PUT', 'DELETE'],
      rmMethods: ['PUT', 'DELETE'],
    };
    await redeploy(lambdaName, path, options);

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
    expect(responsePut.statusCode).toBe(403);
    expect(responsePost.statusCode).toBe(201);
    expect(responseDelete.statusCode).toBe(403);
  });

  test('method "ANY" accepts all methods', async () => {
    const testLambdaWithMultipleMethods = await readFile(`${path}/templates/testLambdaWithMultipleMethods.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithMultipleMethods);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    const addAny = { methods: ['ANY'] };
    const rmAny = { rmMethods: ['ANY'] };

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

      expect(responseGet.statusCode).toBe(200);
      expect(responsePut.statusCode).toBe(403);
      expect(responsePost.statusCode).toBe(403);
      expect(responseDelete.statusCode).toBe(403);

      await redeploy(lambdaName, path, addAny);
      await delay(60000);
      responseGet = await asyncHttpsGet(url);
      responsePost = await asyncHttpsRequest(postOptions);
      responsePut = await asyncHttpsRequest(putOptions);
      responseDelete = await asyncHttpsRequest(deleteOptions);

      expect(responseGet.statusCode).toBe(200);
      expect(responsePut.statusCode).toBe(200);
      expect(responsePost.statusCode).toBe(201);
      expect(responseDelete.statusCode).toBe(204);

      await redeploy(lambdaName, path, rmAny);
      await delay(60000);
      responseGet = await asyncHttpsGet(url);
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
