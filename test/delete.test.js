const {
  asyncDeleteRole,
  asyncDetachPolicy,
} = require('../src/aws/awsFunctions');

const deployLambda = require('../src/aws/deployLambda.js');
const deployApi = require('../src/aws/deployApi.js');
const destroy = require('../src/commands/destroy');
const configTemplate = require('../templates/configTemplate');
const { createBamRole } = require('../src/aws/createRoles');
const { doesLambdaExist, doesApiExist } = require('../src/aws/doesResourceExist');

const {
  createDirectory,
  createJSONFile,
  promisifiedRimraf,
  readFile,
  writeFile,
  readFuncLibrary,
  exists,
} = require('../src/util/fileUtils');

const roleName = 'testBamRole';
const lambdaName = 'testBamLambda';
const testPolicyARN = 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole';
const path = './test';
const cwd = process.cwd();
const stageName = 'bam';
const httpMethods = ['GET'];

describe('bam delete lambda', () => {
  beforeEach(async () => {
    jest.setTimeout(100000);
    await createDirectory('.bam', path);
    await createDirectory('functions', `${path}/.bam/`);
    const config = await configTemplate(roleName);
    config.accountNumber = process.env.AWS_ID;
    await createJSONFile('config', `${path}/.bam/`, config);
    await createJSONFile('library', `${path}/.bam/functions`, {});
    await createBamRole(roleName);
    const testLambdaFile = await readFile('./test/templates/testLambda.js');
    await writeFile(`${cwd}/${lambdaName}.js`, testLambdaFile);
    await deployLambda(lambdaName, 'test description', path);
    await deployApi(lambdaName, path, httpMethods, stageName);
  });

  afterEach(async () => {
    await promisifiedRimraf(`${path}/.bam`);
    await asyncDetachPolicy({ PolicyArn: testPolicyARN, RoleName: roleName });
    await asyncDeleteRole({ RoleName: roleName });
  });

  test('Lambda directory does not exists within ./test/.bam/functions', async () => {
    let template = await exists(`${path}/.bam/functions/${lambdaName}`);
    expect(template).toBe(true);
    await destroy(lambdaName, path);
    template = await exists(`${path}/.bam/functions/${lambdaName}`);
    expect(template).toBe(false);
  });

  test('Lambda metadata is removed from ./test/.bam/functions/library.json', async () => {
    let library = await readFuncLibrary(path);
    let lambda = library[lambdaName];
    expect(lambda).toBeDefined();

    await destroy(lambdaName, path);

    library = await readFuncLibrary(path);
    lambda = library[lambdaName];
    expect(lambda).toBeUndefined();
  });

  test('Lambda does not exists on AWS', async () => {
    let lambda = await doesLambdaExist(lambdaName);
    expect(lambda).toBe(true);
    await destroy(lambdaName, path);
    lambda = await doesLambdaExist(lambdaName);
    expect(lambda).toBe(false);
  });

  test('API endpoint does not exists on AWS', async () => {
    const library = await readFuncLibrary(path);
    const { restApiId } = library[lambdaName].api;
    let endpoint = await doesApiExist(restApiId);
    expect(endpoint).toBe(true);
    await destroy(lambdaName, path);
    endpoint = await doesApiExist(restApiId);
    expect(endpoint).toBe(false);
  });
});
