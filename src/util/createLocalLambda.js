const { asyncGetRegion } = require('./getRegion');
const { bamLog } = require('../util/logger');
const {
  readFile,
  writeFile,
  copyFile,
  mkdir,
} = require('./fileUtils');

const createLocalLambdaFile = async (lambdaName, options) => {
  const cwd = process.cwd();

  let lambdaTemplate;
  if (options.invoker) {
    const userRegion = await asyncGetRegion();
    lambdaTemplate = await readFile(`${__dirname}/../../templates/invokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/lambdaTemplate.js`, 'utf8');
  }

  await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
  bamLog(`Template file "${lambdaName}" was created.`);
};

const createLocalLambdaDirectory = async (lambdaName, options) => {
  const cwd = process.cwd();

  await mkdir(lambdaName);
  await copyFile(`${__dirname}/../../templates/indexTemplate.html`, `${cwd}/${lambdaName}/index.html`);
  await copyFile(`${__dirname}/../../templates/mainTemplate.css`, `${cwd}/${lambdaName}/main.css`);

  let lambdaTemplate;
  if (options.invoker) {
    const userRegion = await asyncGetRegion();
    lambdaTemplate = await readFile(`${__dirname}/../../templates/dirInvokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/dirLambdaTemplate.js`, 'utf8');
  }

  await writeFile(`${cwd}/${lambdaName}/${lambdaName}.js`, lambdaTemplate);
  bamLog(`Template directory "${lambdaName}" was created.`);
};

module.exports = {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
};