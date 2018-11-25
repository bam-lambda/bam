const { exists, writeFile, readFile } = require('../util/fileUtils');
const { bamWarn } = require('../util/logger');

module.exports = async function create(lambdaName, path) {
  const cwd = process.cwd();
  const lambdaTemplate = await readFile(`${__dirname}/../../templates/lambdaTemplate.js`, 'utf8');

  // display error to warn user if lambdaName has already been used
  const alreadyExists = await exists(`${path}/.bam/functions/${lambdaName}`);
  if (alreadyExists) {
    bamWarn(`The name ${lambdaName} is already being used. Please select another.`);
    return;
  }

  await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
};
