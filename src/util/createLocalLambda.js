const { asyncGetRegion } = require('./getRegion');

const {
  readFile,
  writeFile,
  copyFile,
  mkdir,
} = require('./fileUtils');

const {
  bamLog,
  msgAfterAction,
} = require('../util/logger');

const createLocalLambdaFile = async (lambdaName, createInvokerTemplate, includeComments) => {
  const cwd = process.cwd();
  const userRegion = await asyncGetRegion();

  let lambdaTemplate;
  if (createInvokerTemplate && includeComments) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withComments/invokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else if (createInvokerTemplate) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withoutComments/invokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else if (includeComments) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withComments/lambdaTemplate.js`, 'utf8');
  } else {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withoutComments/lambdaTemplate.js`, 'utf8');
  }

  await writeFile(`${cwd}/${lambdaName}.js`, lambdaTemplate);
  bamLog(msgAfterAction('file', `${lambdaName}.js`, 'created'));
};

const createLocalLambdaDirectory = async (lambdaName, createInvokerTemplate, includeComments) => {
  const cwd = process.cwd();
  const userRegion = await asyncGetRegion();

  await mkdir(lambdaName);
  await copyFile(`${__dirname}/../../templates/indexTemplate.html`, `${cwd}/${lambdaName}/index.html`);
  await copyFile(`${__dirname}/../../templates/mainTemplate.css`, `${cwd}/${lambdaName}/main.css`);

  let lambdaTemplate;
  if (createInvokerTemplate && includeComments) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withComments/htmlInvokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else if (createInvokerTemplate) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withoutComments/htmlInvokerLambdaTemplate.js`, 'utf8');
    lambdaTemplate = lambdaTemplate.replace('UserRegion', userRegion);
  } else if (includeComments) {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withComments/htmlLambdaTemplate.js`, 'utf8');
  } else {
    lambdaTemplate = await readFile(`${__dirname}/../../templates/withoutComments/htmlLambdaTemplate.js`, 'utf8');
  }

  await writeFile(`${cwd}/${lambdaName}/${lambdaName}.js`, lambdaTemplate);
  bamLog(msgAfterAction('directory', `${lambdaName}`, 'created'));
};

module.exports = {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
};
