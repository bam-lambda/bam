const deployLambda = require('../src/aws/deployLambda');
const deleteLambda = require('../src/aws/deleteLambda');
const { createBamRole } = require('../src/aws/createRoles');
const { doesLambdaExist } = require('../src/aws/doesResourceExist');
const setupBamDirAndFiles = require('../src/util/setupBamDirAndFiles');

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
  readFile,
  createDirectory,
  getStagingPath,
  getBamPath,
  promisifiedRimraf,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN =
  'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const otherTestPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole';
const path = './test';
const bamPath = getBamPath(path);
const stagingPath = getStagingPath(path);
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
    await promisifiedRimraf(bamPath);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDetachPolicy({
      PolicyArn: otherTestPolicyARN,
      RoleName: roleName,
    });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test(`Zip file exists within ${stagingPath}/${lambdaName}`, async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, path);
    const zipFile = await exists(
      `${stagingPath}/${lambdaName}/${lambdaName}.zip`,
    );
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(zipFile).toBe(true);
  });

  test('Lambda exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, path);
    const lambda = await doesLambdaExist(lambdaName);
    await unlink(`${cwd}/${lambdaName}.js`);
    expect(lambda).toBe(true);
  });

  test('Lambda deployed with folder exists on AWS', async () => {
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await createDirectory(lambdaName, cwd);
    await writeFile(`${cwd}/${lambdaName}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, path, roleName, true);
    const lambda = await doesLambdaExist(lambdaName);
    await promisifiedRimraf(`${cwd}/${lambdaName}`);
    expect(lambda).toBe(true);
  });
});
