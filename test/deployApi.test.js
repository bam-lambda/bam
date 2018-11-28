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
const delay = require('../src/util/delay');
const { bamError } = require('../src/util/logger');

const {
  writeFile,
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
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();
const stageName = 'bamTest';
const httpMethod = 'GET';

const asyncHttpsGet = endpoint => (
  new Promise((resolve) => {
    https.get(endpoint, resolve);
  })
);

const asyncHttpsPost = opts => (
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

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));

describe('bam deploy api', () => {
  beforeEach(async () => {
console.log('before...')
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
console.log('before done...')
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
    await deployApi(lambdaName, path, httpMethod, stageName);

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    let responseStatus;

    try {
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      bamErr(err);
    }

    expect(responseStatus).toEqual(200);
  });

  test('Api metadata exists within ./test/.bam/functions/library.json', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethod, stageName);

    const library = await readFuncLibrary(path);
    const { api } = library[lambdaName];
    expect(api).toBeTruthy();
  });

  test('Api endpoint exists on AWS', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethod, stageName);

    const library = await readFuncLibrary(path);
    const { restApiId } = library[lambdaName].api;
    const apiExists = await doesApiExist(restApiId);
    expect(apiExists).toBe(true);
  });

  test('Response contains query param in body', async () => {
    const testLambdaWithQueryParams = await readFile(`${path}/templates/testLambdaWithQueryParams.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithQueryParams);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethod, stageName);

    const library = await readFuncLibrary(path);
    const url = `${library[lambdaName].api.endpoint}?name=John`;
    let responseBody;

    try {
      const response = await asyncHttpsGet(url);
      response.setEncoding('utf8');
      response.on('data', (data) => {
        responseBody = data;
        expect(responseBody).toMatch('John');
      });
    } catch (err) {
      bamErr(err);
    }
  });

  test('POST request returns 201 status code', async () => {
    const testLambdaForPostMethod = await readFile(`${path}/templates/testLambdaForPostMethod.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaForPostMethod);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, 'POST', stageName);

    const library = await readFuncLibrary(path);
    const url = library[lambdaName].api.endpoint;
    const urlParts = url.split('//')[1].split('/');
    const options = {
      hostname: urlParts[0],
      path: `/${urlParts.slice(1).join('/')}`,
      method: 'POST',
    };

    let response;
    try {
      response = await asyncHttpsPost(options);
    } catch (err) {
      bamError(err);
    }

    expect(response.statusCode).toBe(201);
  });
});
