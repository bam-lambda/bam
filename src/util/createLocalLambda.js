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

const getTemplate = async (withOrWithoutComments, templateType) => {
  const userRegion = await asyncGetRegion();
  const lambdaTemplateLocation = `${__dirname}/../../templates/${withOrWithoutComments}/${templateType}Template.js`;
  const lambdaTemplate = await readFile(lambdaTemplateLocation, 'utf8')
    .replace('userRegion', userRegion);
  return lambdaTemplate;
};

const writeTemplateLocally = async (lambdaName, withOrWithoutComments, templateType) => {
  const cwd = process.cwd();
  const template = await getTemplate(withOrWithoutComments, templateType);
  await writeFile(`${cwd}/${lambdaName}.js`, template);
};

const createLocalLambdaFile = async (
  lambdaName,
  createInvokerTemplate,
  createDbScanTemplate,
  createDbPutTemplate,
  includeComments,
) => {
  let templateType;
  const withOrWithoutComments = includeComments ? 'With' : 'Without';

  if (createInvokerTemplate) {
    templateType = 'invokerLambda';
  } else if (createDbScanTemplate) {
    templateType = 'dbScanLambda';
  } else if (createDbPutTemplate) {
    templateType = 'dbPutLambda';
  } else {
    templateType = 'lambda';
  }

  await writeTemplateLocally(lambdaName, withOrWithoutComments, templateType);
  bamLog(msgAfterAction('file', `${lambdaName}.js`, 'created'));
};

const createLocalLambdaDirectory = async (lambdaName, createInvokerTemplate, includeComments) => {
  const cwd = process.cwd();

  await mkdir(lambdaName);
  await copyFile(`${__dirname}/../../templates/indexTemplate.html`, `${cwd}/${lambdaName}/index.html`);
  await copyFile(`${__dirname}/../../templates/mainTemplate.css`, `${cwd}/${lambdaName}/main.css`);

  let templateType;
  const withOrWithoutComments = includeComments ? 'With' : 'Without';

  if (createInvokerTemplate) {
    templateType = 'htmlInvokerLambda';
  } else {
    templateType = 'htmlLambda';
  }

  await writeTemplateLocally(lambdaName, withOrWithoutComments, templateType);
  bamLog(msgAfterAction('directory', `${lambdaName}`, 'created'));
};

module.exports = {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
};
