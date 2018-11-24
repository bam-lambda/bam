const { writeFile, readFile } = require('../util/fileUtils.js');
const { bamWarn } = require('../util/fancyText.js');
const { validateLambdaCreation } = require('../util/validateLambda.js');

module.exports = async function create(lambdaName) {
  const invalidLambdaMsg = await validateLambdaCreation(lambdaName);

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const cwd = process.cwd();
  const lambdaTemplate = await readFile(`${__dirname}/../../templates/lambdaTemplate.js`, 'utf8');
  await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
};
