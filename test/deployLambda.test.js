const deployLambda = require('../src/aws/deployLambda.js');
const deleteLambda = require('../src/aws/deleteLambda');
const { createBamRole } = require('../src/aws/createRoles');
const { doesLambdaExist } = require('../src/aws/doesResourceExist');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');
const { asyncGetRegion } = require('../src/util/getRegion');

const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const {
  writeFile,
  readConfig,
  writeConfig,
  unlink,
  exists,
  readLambdasLibrary,
  readFile,
  createDirectory,
  promisifiedRimraf,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const lambdaDescription = 'test description';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();

describe('bam deploy lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(30000);
    await setupBamDirAndFiles(roleName, path);
    const config = await readConfig(path);
    config.accountNumber = process.env.AWS_ID;
    await writeConfig(path, config);
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
    await deployLambda(lambdaName, lambdaDescription, path);
    const zipFile = await exists(`${path}/.bam/functions/${lambdaName}/${lambdaName}.zip`);
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(zipFile).toBe(true);
  });

  test('Lambda exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, lambdaDescription, path);
    const lambda = await doesLambdaExist(lambdaName);
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(lambda).toBe(true);
  });

  test('Lambda deployed with folder exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await createDirectory(lambdaName, cwd);
    await writeFile(`${cwd}/${lambdaName}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, lambdaDescription, path);
    const lambda = await doesLambdaExist(lambdaName);
    await promisifiedRimraf(`${cwd}/${lambdaName}`);
    expect(lambda).toBe(true);
  });
});
