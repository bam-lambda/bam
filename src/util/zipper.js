const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { getStagingPath } = require('./fileUtils');

const { bamError } = require('./logger');

const cwd = process.cwd();

const unzipper = async (lambdaName) => {
  const file = `${cwd}/${lambdaName}/${lambdaName}.zip`;

  try {
    await exec(`unzip ${file}`, { cwd: `${cwd}/${lambdaName}` });
  } catch (err) {
    bamError(err, err.stack);
  }
};

const zipper = async (lambdaName, path, directoryName) => {
  const stagingPath = getStagingPath(path);
  let dirName = directoryName;

  if (dirName === undefined) dirName = lambdaName; // may be lambdaName-temp
  const dir = `${stagingPath}/${dirName}`;

  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
  } catch (err) {
    bamError(err);
  }

  return `${dir}/${lambdaName}.zip`;
};

module.exports = { zipper, unzipper };
