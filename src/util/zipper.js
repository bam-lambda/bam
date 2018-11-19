const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async function zipper(lambdaName, path = '.') {
  const dir = `${path}/bam/functions/${lambdaName}`;

  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
    console.log(`zipped file was created at ${dir}/${lambdaName}.zip`);
  } catch (err) {
    console.log(err, err.stack);
  }

  return `${dir}/${lambdaName}.zip`;
};
