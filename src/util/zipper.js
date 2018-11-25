const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { bamError } = require('./fancyText');

const cwd = process.cwd();

const unzipper = async (lambdaName) => {
  const file = `${cwd}/${lambdaName}/${lambdaName}.zip`;

  try {
    await exec(`unzip ${file}`, { cwd: `${cwd}/${lambdaName}` });
  } catch (err) {
    bamError(err, err.stack);
  }
};

const zipper = async (lambdaName, path) => {
  const dir = `${path}/.bam/functions/${lambdaName}`;

  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
  } catch (err) {
    bamError(err, err.stack);
  }

  return `${dir}/${lambdaName}.zip`;
};

module.exports = { zipper, unzipper };
