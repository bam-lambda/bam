const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async function zipper(lambdaName, path, dirName) {
  if (dirName === undefined) dirName = lambdaName; // may be lambdaName-temp
  const dir = `${path}/.bam/functions/${dirName}`;
  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
  } catch (err) {
    console.log(err, err.stack);
  }

  return `${dir}/${lambdaName}.zip`;
};
