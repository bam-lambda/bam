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
  const configJSON = JSON.stringify(config);
  await writeFile(`${path}/.bam/config.json`, configJSON);
};

const readFuncLibrary = async (path) => {
  const libraryJSON = await readFile(`${path}/.bam/functions/library.json`);
  return JSON.parse(libraryJSON);
};

const writeFuncLibrary = async (path, functions) => {
  const functionsJSON = JSON.stringify(functions);
  await writeFile(`${path}/.bam/functions/library.json`, functionsJSON);
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
  const configStr = JSON.stringify(json);
  await writeFile(`${path}/${fileName}.json`, configStr);
};

const promisifiedRimraf = dir => new Promise(res => rimraf(dir, res));

// add creatDirectory & createJSON

module.exports = {
  readFile,
  writeFile,
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
  readFuncLibrary,
  writeFuncLibrary,
  promisifiedRimraf,
};
