const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');
const destroy = require('../src/commands/destroy');
const get = require('../src/commands/get');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const { createBamRole } = require('../src/aws/createRoles');
const configTemplate = require('../templates/configTemplate');
const {
  readFile,
  promisifiedRimraf,
  createDirectory,
  createJSONFile,
  writeFile,
  exists,
  unlink,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const path = './test';
const cwd = process.cwd();
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const stageName = 'bam';
const httpMethods = ['GET'];

describe('bam get', async () => {
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
    await promisifiedRimraf(`${cwd}/${lambdaName}`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('lambdaName directory and lambdaName.js will be created in cwd', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await unlink(`${cwd}/${lambdaName}.js`);
    await get(lambdaName, path);
    const lambdaNameDirExists = await exists(`${cwd}/${lambdaName}`);
    const lambdaNameFileExists = await exists(`${cwd}/${lambdaName}/${lambdaName}.js`);
    expect(lambdaNameDirExists).toBe(true);
    expect(lambdaNameFileExists).toBe(true);
  });

  test('lambdaName.js in lambdaName dir will contain lambda code', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambdaGet.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await unlink(`${cwd}/${lambdaName}.js`);
    await get(lambdaName, path);
    const lambdaFile = await readFile(`${cwd}/${lambdaName}/${lambdaName}.js`, 'utf8');
    const testStr = 'The get command was used to retrieve this lambda';
    const lambdaFileContainsTestStr = lambdaFile.includes(testStr);
    const lambdaFileDoesNotContainWordTest = !lambdaFile.includes('test');
    expect(lambdaFileContainsTestStr).toBe(true);
    expect(lambdaFileDoesNotContainWordTest).toBe(true);
  });

  test('retrieved dir of lambda with dependencies will contain node_modules', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambdaWithDependencies.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
    await unlink(`${cwd}/${lambdaName}.js`);
    await get(lambdaName, path);
    const lambdaNameDirContainsNodeModules = await exists(`${cwd}/${lambdaName}/node_modules`);
    expect(lambdaNameDirContainsNodeModules).toBe(true);
  });
});
