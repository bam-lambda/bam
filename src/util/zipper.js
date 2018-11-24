const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const { bamError } = require('./logger');

module.exports = async function zipper(lambdaName, path) {
  const dir = `${path}/.bam/functions/${lambdaName}`;

  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
  } catch (err) {
    bamError(err);
  }

  return `${dir}/${lambdaName}.zip`;
};
