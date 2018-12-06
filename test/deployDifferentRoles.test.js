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

});