const https = require('https');

const { createBamRole } = require('../src/aws/createRoles');
const deployLambda = require('../src/aws/deployLambda.js');
const deployApi = require('../src/aws/deployApi.js');
const { doesApiExist } = require('../src/aws/doesResourceExist');
const destroy = require('../src/commands/destroy');
const delay = require('../src/util/delay');
const { bamError } = require('../src/util/logger');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const { asyncGetRegion } = require('../src/util/getRegion');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const {
  unlink,
  writeFile,
  readFile,
  readConfig,
  writeConfig,
  readApisLibrary,
  promisifiedRimraf,
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

describe('bam deploy api', () => {
  beforeEach(async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    jest.setTimeout(120000);
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
    await delay(30000);
  });

  test('Response is 200 when hitting endpoint from apis.json', async () => {
    const region = await asyncGetRegion();
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
    let responseStatus;

    try {
      await delay(60000);
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      bamError(err);
    }

    expect(responseStatus).toEqual(200);
  });

  test('Api metadata exists within bamPath/apis.json', async () => {
    const region = await asyncGetRegion();
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const api = apis[region][lambdaName];
    expect(api).toBeTruthy();
  });

  test('Api endpoint exists on AWS', async () => {
    const region = await asyncGetRegion();
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const { restApiId } = apis[region][lambdaName];
    const apiExists = await doesApiExist(restApiId);
    expect(apiExists).toBe(true);
  });

  test('Response contains query param in body', async () => {
    const region = await asyncGetRegion();
    const testLambdaWithQueryParams = await readFile(`${path}/templates/testLambdaWithQueryParams.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaWithQueryParams);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);

    const apis = await readApisLibrary(path);
    const url = `${apis[region][lambdaName].endpoint}?name=John`;
    let responseBody;

    try {
      const response = await asyncHttpsGet(url);
      response.setEncoding('utf8');
      response.on('data', (data) => {
        responseBody = data;
        expect(responseBody).toMatch('John');
      });
    } catch (err) {
      bamError(err);
    }
  });

  test('POST request returns 201 status code', async () => {
    const region = await asyncGetRegion();
    const testLambdaForPostMethod = await readFile(`${path}/templates/testLambdaForPostMethod.js`);
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaForPostMethod);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, ['POST'], stageName);

    const apis = await readApisLibrary(path);
    const url = apis[region][lambdaName].endpoint;
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
