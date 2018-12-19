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

const getTemplate = async (withOrWithout, templateType) => {
  const userRegion = await asyncGetRegion();
  const lambdaTemplateLocation = `${__dirname}/../../templates/${withOrWithout}Comments/${templateType}Template.js`;
  const lambdaTemplate = await readFile(lambdaTemplateLocation, 'utf8');
  const lambdaTemplateWithRegion = lambdaTemplate.replace('userRegion', userRegion);
  return lambdaTemplateWithRegion;
};

const writeTemplateLocally = async (lambdaName, withOrWithout, templateType, withinDir) => {
  const cwd = process.cwd();
  const template = await getTemplate(withOrWithout, templateType);

  await writeFile(`${cwd}/${withinDir ? `${lambdaName}/` : ''}${lambdaName}.js`, template);
};

const createLocalLambdaFile = async (
  lambdaName,
  createInvokerTemplate,
  createDbScanTemplate,
  createDbPutTemplate,
  includeComments,
) => {
  let templateType;
  const withOrWithout = includeComments ? 'With' : 'Without';

  if (createInvokerTemplate) {
    templateType = 'invokerLambda';
  } else if (createDbScanTemplate) {
    templateType = 'dbScanLambda';
  } else if (createDbPutTemplate) {
    templateType = 'dbPutLambda';
  } else {
    templateType = 'lambda';
  }

  await writeTemplateLocally(lambdaName, withOrWithout, templateType, false);
  bamLog(msgAfterAction('file', `${lambdaName}.js`, 'created'));
};

const createLocalLambdaDirectory = async (
  lambdaName,
  createInvokerTemplate,
  createDbScanTemplate,
  includeComments,
) => {
  const cwd = process.cwd();

  await mkdir(lambdaName);
  await copyFile(`${__dirname}/../../templates/indexTemplate.html`, `${cwd}/${lambdaName}/index.html`);
  await copyFile(`${__dirname}/../../templates/mainTemplate.css`, `${cwd}/${lambdaName}/main.css`);

  let templateType;
  const withOrWithout = includeComments ? 'With' : 'Without';

  if (createInvokerTemplate) {
    templateType = 'htmlInvokerLambda';
  } else if (createDbScanTemplate) {
    templateType = 'htmlDbScanLambda';
  } else {
    templateType = 'htmlLambda';
  }

  await writeTemplateLocally(lambdaName, withOrWithout, templateType, true);
  bamLog(msgAfterAction('directory', `${lambdaName}`, 'created'));
};

module.exports = {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
};
