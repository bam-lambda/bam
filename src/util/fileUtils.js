const fs = require('fs');
const { promisify } = require('util');
const rimraf = require('rimraf');
const exec = promisify(require('child_process').exec);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);
const readdir = promisify(fs.readdir);
const { createWriteStream } = fs;

const exists = async path => (
  new Promise((res) => {
    fs.stat(path, (err) => {
      if (err === null) res(true);
      res(false);
    });
  })
);

const readConfig = async (path) => {
  const config = await readFile(`${path}/.bam/config.json`);
  return JSON.parse(config);
};

const writeConfig = async (path, config) => {
  const configJSON = JSON.stringify(config, null, 2);
  await writeFile(`${path}/.bam/config.json`, configJSON);
};

const isConfigured = async (path) => {
  const config = await readConfig(path);
  return config.accountNumber && config.region && config.role;
};

const readFuncLibrary = async (path) => {
  const libraryJSON = await readFile(`${path}/.bam/functions/library.json`);
  return JSON.parse(libraryJSON);
};

const writeFuncLibrary = async (path, functions) => {
  const functionsJSON = JSON.stringify(functions, null, 2);
  await writeFile(`${path}/.bam/functions/library.json`, functionsJSON);
};

const writeLambda = async (data, path, description = '') => {
  const name = data.FunctionName;
  const arn = data.FunctionArn;
  const api = {
    endpoint: '',
    restApiId: '',
  };

  const functions = await readFuncLibrary(path);
  functions[name] = { arn, description, api };
  await writeFuncLibrary(path, functions);
};

const writeApi = async (endpoint, lambdaName, restApiId, path) => {
  const functions = await readFuncLibrary(path);
  functions[lambdaName].api = { endpoint, restApiId };
  await writeFuncLibrary(path, functions);
};

const mkdir = promisify(fs.mkdir);

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

module.exports = {
  readFile,
  writeFile,
  copyDir,
  copyFile,
  unlink,
  rename,
  exec,
  readdir,
  createWriteStream,
  exists,
  createDirectory,
  createJSONFile,
  readConfig,
  writeConfig,
  isConfigured,
  readFuncLibrary,
  writeFuncLibrary,
  writeLambda,
  writeApi,
  promisifiedRimraf,
};
