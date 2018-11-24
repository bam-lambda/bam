const { promisify } = require('util');
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');
const rimraf = require('rimraf');

const createDirectory = require('../src/util/createDirectory');
const configTemplate = require('../templates/configTemplate');
const createRole = require('../src/aws/createRole');
const createJSONFile = require('../src/util/createJSONFile');

const deployLambda = require('../src/aws/deployLambda.js');
const deployApi = require('../src/aws/deployApi.js');

const updateLambda = require('../src/aws/updateLambda.js');
const redeploy = require('../src/commands/redeploy.js');

const deleteLambda = require('../src/aws/deleteLambda');
const { doesApiExist } = require('../src/aws/doesResourceExist');
const deleteApi = require('../src/aws/deleteApi');
const delay = require('../src/util/delay.js');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const stageName = 'test';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const path = './test';
const config = configTemplate(roleName);
config.accountNumber = process.env.AWS_ID;

const testLambdaFile = fs.readFileSync('./test/templates/testLambda.js');
const testLambdaWithDependenciesFile = fs.readFileSync('./test/templates/testLambdaWithDependencies.js');
const cwd = process.cwd();

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));


describe('bam redeploy lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(60000);
    createDirectory('.bam', path);
    createDirectory('functions', `${path}/.bam/`);
    createJSONFile('config', `${path}/.bam`, config);
    createJSONFile('library', `${path}/.bam/functions`, {});
    await createRole(roleName, path);
    fs.writeFileSync(`${cwd}/${lambdaName}.js`, testLambdaFile);
  });

  afterEach(async () => {
    const library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
    const { restApiId } = library[lambdaName].api;
    await deleteApi(restApiId, path);
    await deleteLambda(lambdaName, path);
    await asyncRimRaf(`${path}/.bam`);
    fs.unlinkSync(`${cwd}/${lambdaName}.js`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
    await delay(30000);
  });

  test('Response still 200 from same url after changing lambda', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
    const url = library[lambdaName].api.endpoint;
    let responseStatus;

    const asyncHttpsGet = endpoint => (
      new Promise((resolve) => {
        https.get(endpoint, resolve);
      })
    );

    try {
      fs.writeFileSync(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
      await updateLambda(lambdaName, path);      
      const response = await asyncHttpsGet(url);
      responseStatus = response.statusCode;
    } catch (err) {
      console.log(err, err.stack);
    }

    expect(responseStatus).toEqual(200);
  });


  test('Response contains different body before and after redeployment', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    const library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
    const url = library[lambdaName].api.endpoint;
    let responseBody;

    const asyncHttpsGet = endpoint => (
      new Promise((resolve) => {
        https.get(endpoint, resolve);
      })
    );

    try {
      const preResponse = await asyncHttpsGet(url);
      preResponse.setEncoding('utf8');
      preResponse.on('data', (data) => {
        responseBody = data;
        expect(responseBody).toMatch('<h1>This is a test</h1>');
      });

      fs.writeFileSync(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
      await updateLambda(lambdaName, path);

      const postResponse = await asyncHttpsGet(url);
      postResponse.setEncoding('utf8');
      postResponse.on('data', (data) => {
        responseBody = data;
        expect(responseBody).toMatch('uuid');
        expect(responseBody).toMatch('2016-12');
        expect(responseBody).toMatch('cool');
      });
    } catch (err) {
      console.log(err, err.stack);
    }
  });

  test('Local node modules exist for dependencies only post redeployment', async () => {
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, stageName);

    let nodeModules = fs.existsSync(`${path}/.bam/functions/${lambdaName}/node_modules`); 
    expect(nodeModules).toBe(false);

    fs.writeFileSync(`${cwd}/${lambdaName}.js`, testLambdaWithDependenciesFile);
    await redeploy(lambdaName, path);

    nodeModules = fs.existsSync(`${path}/.bam/functions/${lambdaName}/node_modules`); 
    expect(nodeModules).toBe(true);
  });  
});
