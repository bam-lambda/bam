const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = async function zipper(lambdaName) {
  const dir = `./bam/functions/${lambdaName}`;

  await exec(`zip -r ${lambdaName} index.js`, { cwd: dir });
  console.log('zipped file was created');
};
