const { writeFile, readFile } = require('../util/fileUtils');
const { bamWarn, bamLog } = require('../util/logger');
const { validateLambdaCreation } = require('../util/validations');

module.exports = async function create(lambdaName) {
  const invalidLambdaMsg = await validateLambdaCreation(lambdaName);

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const cwd = process.cwd();
  const lambdaTemplate = await readFile(`${__dirname}/../../templates/lambdaTemplate.js`, 'utf8');
  await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
  bamLog(`Template file "${lambdaName}.js" was created.`);
};
