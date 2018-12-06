const destroy = require('../src/commands/destroy');
const get = require('../src/commands/get');
const deployLambda = require('../src/aws/deployLambda');
const deployApi = require('../src/aws/deployApi');
const { createBamRole } = require('../src/aws/createRoles');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const {
  readFile,
  writeConfig,
  readConfig,
  promisifiedRimraf,
  writeFile,
  writeLambda,
  writeApi,
  exists,
  getBamPath,
  unlink,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const path = './test';
const bamPath = getBamPath(path);
const cwd = process.cwd();
const lambdaName = 'testBamLambda';
const lambdaDescription = 'test description';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const stageName = 'bam';
const httpMethods = ['GET'];

describe('bam get', async () => {
  beforeEach(async () => {
    jest.setTimeout(60000);
    await setupBamDirAndFiles(roleName, path);
    const config = await readConfig(path);
    config.accountNumber = process.env.AWS_ID;
    await writeConfig(path, config);
    await createBamRole(roleName);
  });

  afterEach(async () => {
    await destroy(lambdaName, path);
    await promisifiedRimraf(bamPath);
    await promisifiedRimraf(`${cwd}/${lambdaName}`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDetachPolicy({ PolicyArn: otherTestPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('lambdaName directory and lambdaName.js will be created in cwd', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
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
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
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
    const lambdaData = await deployLambda(lambdaName, lambdaDescription, path);
    const { restApiId, endpoint } = await deployApi(lambdaName, path, httpMethods, stageName);
    await writeLambda(lambdaData, path, lambdaDescription);
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
    await unlink(`${cwd}/${lambdaName}.js`);
    await get(lambdaName, path);
    const lambdaNameDirContainsNodeModules = await exists(`${cwd}/${lambdaName}/node_modules`);
    expect(lambdaNameDirContainsNodeModules).toBe(true);
  });
});
