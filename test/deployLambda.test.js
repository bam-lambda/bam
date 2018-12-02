const { promisify } = require('util');
const AWS = require('aws-sdk');

const deployLambda = require('../src/aws/deployLambda.js');
const deleteLambda = require('../src/aws/deleteLambda');
const configTemplate = require('../templates/configTemplate');
const { createBamRole } = require('../src/aws/createRoles');
const { doesLambdaExist } = require('../src/aws/doesResourceExist');

const {
  writeFile,
  unlink,
  exists,
  readFuncLibrary,
  readFile,
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
} = require('../src/util/fileUtils');

const iam = new AWS.IAM();
const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';

const asyncDetachPolicy = promisify(iam.detachRolePolicy.bind(iam));
const asyncDeleteRole = promisify(iam.deleteRole.bind(iam));
const cwd = process.cwd();

describe('bam deploy lambda', () => {
  beforeEach(async () => {
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    jest.setTimeout(30000);
    await createDirectory('.bam', path);
    await createDirectory('functions', `${path}/.bam/`);
    await createJSONFile('config', `${path}/.bam/`, config);
    await createJSONFile('library', `${path}/.bam/functions`, {});
    await createBamRole(roleName);
  });

  afterEach(async () => {
    await deleteLambda(lambdaName, path);
    await promisifiedRimraf(`${path}/.bam`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test(`Zip file exists within ./test/.bam/functions/${lambdaName}`, async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    const zipFile = await exists(`${path}/.bam/functions/${lambdaName}/${lambdaName}.zip`);
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(zipFile).toBe(true);
  });

  test('Lambda exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    const lambda = await doesLambdaExist(lambdaName);
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(lambda).toBe(true);
  });

  test('Lambda metadata exists within ./test/.bam/functions/library.json', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    const library = await readFuncLibrary(path);
    const lambda = library[lambdaName];
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(lambda).toBeTruthy();
  });

  test('Lambda deployed with folder exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await createDirectory(lambdaName, cwd);
    await writeFile(`${cwd}/${lambdaName}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    const lambda = await doesLambdaExist(lambdaName);
    await promisifiedRimraf(`${cwd}/${lambdaName}`);
    expect(lambda).toBe(true);
  });
});
