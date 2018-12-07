const fs = require('fs');
const { promisify } = require('util');
const rimraf = require('rimraf');
const exec = promisify(require('child_process').exec);

const { asyncGetRegion } = require('./getRegion');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const { createWriteStream } = fs;
const getBamPath = path => `${path}/.bam`;
const getStagingPath = path => `${getBamPath(path)}/staging`;

const exists = async path => (
  new Promise((res) => {
    fs.stat(path, (err) => {
      if (err === null) res(true);
      res(false);
    });
  })
);

const readConfig = async (path) => {
  const bamPath = getBamPath(path);
  const config = await readFile(`${bamPath}/config.json`);
  return JSON.parse(config);
};

const writeConfig = async (path, config) => {
  const bamPath = getBamPath(path);
  const configJSON = JSON.stringify(config, null, 2);
  await writeFile(`${bamPath}/config.json`, configJSON);
};

const isConfigured = async (path) => {
  const config = await readConfig(path);
  return config.accountNumber && config.region && config.role;
};

const readLambdasLibrary = async (path) => {
  const bamPath = getBamPath(path);
  const json = await readFile(`${bamPath}/lambdas.json`);
  return JSON.parse(json);
};

const writeLambdasLibrary = async (path, lambdas) => {
  const bamPath = getBamPath(path);
  const json = JSON.stringify(lambdas, null, 2);
  await writeFile(`${bamPath}/lambdas.json`, json);
};

const readApisLibrary = async (path) => {
  const bamPath = getBamPath(path);
  const json = await readFile(`${bamPath}/apis.json`);
  return JSON.parse(json);
};

const writeApisLibrary = async (path, apis) => {
  const bamPath = getBamPath(path);
  const json = JSON.stringify(apis, null, 2);
  await writeFile(`${bamPath}/apis.json`, json);
};

const readDbtablesLibrary = async (path) => {
  const bamPath = getBamPath(path);
  const json = await readFile(`${bamPath}/dbtables.json`);
  return JSON.parse(json);
};

const writeDbtablesLibrary = async (path, dbtables) => {
  const bamPath = getBamPath(path);
  const json = JSON.stringify(dbtables, null, 2);
  await writeFile(`${bamPath}/dbtables.json`, json);
};

const writeLambda = async (data, path, description = '') => {
  const region = await asyncGetRegion();
  const name = data.FunctionName;
  const arn = data.FunctionArn;
  const api = '';

  const lambdas = await readLambdasLibrary(path);
  lambdas[region][name] = { arn, description, api };
  await writeLambdasLibrary(path, lambdas);
};

const writeApi = async (endpoint, methods, resourceName, restApiId, path) => {
  const region = await asyncGetRegion();
  const lambdas = await readLambdasLibrary(path);
  const apis = await readApisLibrary(path);
  lambdas[region][resourceName].api = restApiId;

  apis[region][resourceName] = {
    restApiId,
    endpoint,
    methods,
  };

  await writeLambdasLibrary(path, lambdas);
  await writeApisLibrary(path, apis);
};

const writeDbtable = async (tableName, dbConfig, path) => {
  const region = await asyncGetRegion();
  const tables = await readDbtablesLibrary(path);
  tables[region][tableName] = dbConfig;
  await writeDbtablesLibrary(path, tables);
};

const deleteLambdaFromLibrary = async (resourceName, path) => {
  const region = await asyncGetRegion();
  const lambdas = await readLambdasLibrary(path);
  delete lambdas[region][resourceName];
  await writeLambdasLibrary(path, lambdas);
};

const deleteApiFromLibraries = async (resourceName, path) => {
  const region = await asyncGetRegion();
  const lambdas = await readLambdasLibrary(path);
  const apis = await readApisLibrary(path);

  // TODO: do these steps only if lambda exists
  lambdas[region][resourceName].api = '';
  await writeLambdasLibrary(path, lambdas);

  delete apis[region][resourceName];
  await writeApisLibrary(path, apis);
};

const deleteTableFromLibrary = async (resourceName, path) => {
  const region = await asyncGetRegion();
  const tables = await readDbtablesLibrary(path);
  delete tables[region][resourceName];
  await writeDbtablesLibrary(path, tables);
};

const createDirectory = async (name, path) => {
  const dir = `${path}/${name}`;

  const dirExists = await exists(dir);
  if (!dirExists) {
    await mkdir(dir);
  }
};

const createJSONFile = async (fileName, path, json) => {
  const configStr = JSON.stringify(json, null, 2);
  await writeFile(`${path}/${fileName}.json`, configStr);
};

const promisifiedRimraf = dir => new Promise(res => rimraf(dir, res));

const distinctElements = (arr) => {
  const present = {};
  return arr.reduce((acc, e) => {
    if (!present[e]) {
      present[e] = true;
      acc.push(e);
    }
    return acc;
  }, []);
};

const isDirectory = async (path) => {
  const stat = promisify(fs.stat);
  const statOfPath = await stat(path);
  return statOfPath.isDirectory();
};

const copyDir = async (src, dest) => {
  const entries = await readdir(src);
  await mkdir(dest);

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const srcPath = `${src}/${entry}`;
    const destPath = `${dest}/${entry}`;
    const srcIsDir = await isDirectory(srcPath);

    if (srcIsDir) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
};

const deleteStagingDirForLambda = async (lambdaName, path) => {
  const stagingPath = getStagingPath(path);
  const stagingPathForLambdaName = `${stagingPath}/${lambdaName}`;
  const stagingDirExists = await exists(stagingPathForLambdaName);
  if (stagingDirExists) {
    await promisifiedRimraf(stagingPathForLambdaName);
  }
};

module.exports = {
  getBamPath,
  getStagingPath,
  readFile,
  writeFile,
  copyDir,
  copyFile,
  unlink,
  rename,
  exec,
  readdir,
  mkdir,
  createWriteStream,
  exists,
  createDirectory,
  createJSONFile,
  readConfig,
  writeConfig,
  isConfigured,
  readLambdasLibrary,
  writeLambdasLibrary,
  readApisLibrary,
  writeApisLibrary,
  readDbtablesLibrary,
  writeDbtablesLibrary,
  writeLambda,
  writeApi,
  writeDbtable,
  deleteLambdaFromLibrary,
  deleteApiFromLibraries,
  deleteTableFromLibrary,
  promisifiedRimraf,
  distinctElements,
  deleteStagingDirForLambda,
};
