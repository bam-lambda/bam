const { writeFile, readFile } = require('../util/fileUtils');
const { bamWarn, bamLog } = require('../util/logger');
const { validateLambdaCreation } = require('../util/validations');
const { asyncGetRegion } = require('../util/getRegion');
const createLocalLambdaDirectory = require('../util/createLocalLambdaDirectory');

module.exports = async function create(lambdaName, options) {
  const invalidLambdaMsg = await validateLambdaCreation(lambdaName);

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

  const cwd = process.cwd();

  if (options.dir) { // TODO pick more descriptive flag
    await createLocalLambdaDirectory(lambdaName, options);
    bamLog(`Template directory "${lambdaName}" was created.`);
  } else {
    let lambdaTemplate;
    if (options.invoker) {
      const userRegion = await asyncGetRegion();
      lambdaTemplate = await readFile(`${__dirname}/../../templates/invokerLambdaTemplate.js`, 'utf8');
      lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
    } else {
      lambdaTemplate = await readFile(`${__dirname}/../../templates/lambdaTemplate.js`, 'utf8');
    }

    await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
    bamLog(`Template file "${lambdaName}.js" was created.`);
  }
};
