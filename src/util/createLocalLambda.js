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

const stripComments = template => (
  template.split('\n').filter(line => (
    line.includes('description') || !line.includes('//')
  )).slice(2)
    .join('\n')
    .split('\n\n\n')
    .join('\n')
);

const getTemplate = async (templateType, includeComments) => {
  const userRegion = await asyncGetRegion();
  const lambdaTemplateLocation = `${__dirname}/../../templates/${templateType}Template.js`;
  const lambdaTemplate = await readFile(lambdaTemplateLocation, 'utf8');
  const lambdaTemplateWithRegion = lambdaTemplate.replace('userRegion', userRegion);
  return includeComments ? lambdaTemplateWithRegion : stripComments(lambdaTemplateWithRegion);
};

const writeTemplateLocally = async (lambdaName, template, withinDir) => {
  const cwd = process.cwd();

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

  if (createInvokerTemplate) {
    templateType = 'invokerLambda';
  } else if (createDbScanTemplate) {
    templateType = 'dbScanLambda';
  } else if (createDbPutTemplate) {
    templateType = 'dbPutLambda';
  } else {
    templateType = 'lambda';
  }

  const template = await getTemplate(templateType, includeComments);
  await writeTemplateLocally(lambdaName, template, false);
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

  if (createInvokerTemplate) {
    templateType = 'htmlInvokerLambda';
  } else if (createDbScanTemplate) {
    templateType = 'htmlDbScanLambda';
  } else {
    templateType = 'htmlLambda';
  }

  const template = await getTemplate(templateType, includeComments);
  await writeTemplateLocally(lambdaName, template, true);
  bamLog(msgAfterAction('directory', `${lambdaName}`, 'created'));
};

module.exports = {
  createLocalLambdaFile,
  createLocalLambdaDirectory,
};
