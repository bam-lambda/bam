const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async function zipper(lambdaName, src) {
  const dir = `${src}/bam/functions/${lambdaName}`;

  await exec(`zip -r ${lambdaName} index.js`, { cwd: dir });
  console.log(`zipped file was created at ${dir}/${lambdaName}.zip`);
  return `${dir}/${lambdaName}.zip`;
};
