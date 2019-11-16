const { asyncGetRegion } = require('./getRegion');

const { readFile, writeFile, copyFile, mkdir } = require('./fileUtils');

const { bamLog, msgAfterAction } = require('../util/logger');

const stripComments = (template) =>
  template
    .split('\n')
    .filter((line) => line.includes('description') || !line.includes('//'))
    .slice(1)
    .join('\n');

const removeExcessBlankLines = (template) =>
  template.split('\n\n\n').join('\n\n');

const getTemplate = async (templateType, includeComments) => {
  const userRegion = await asyncGetRegion();
  const lambdaTemplateLocation = `${__dirname}/../../templates/lambdaTemplates/${templateType}Template.js`;
  const lambdaTemplate = await readFile(lambdaTemplateLocation, 'utf8');
  const lambdaTemplateWithRegion = lambdaTemplate.replace(
    'userRegion',
    userRegion,
  );
  return removeExcessBlankLines(
    includeComments
      ? lambdaTemplateWithRegion
      : stripComments(lambdaTemplateWithRegion),
  );
};

const writeTemplateLocally = async (lambdaName, template, withinDir) => {
  const cwd = process.cwd();

  await writeFile(
    `${cwd}/${withinDir ? `${lambdaName}/` : ''}${lambdaName}.js`,
    template,
  );
};

module.exports = async function createLocalLambda(
  lambdaName,
  createInvokerTemplate,
  createDbTemplate,
  includeComments,
  createHtmlTemplate,
) {
  const cwd = process.cwd();
  let templateType;

  if (createInvokerTemplate) {
    templateType = createHtmlTemplate ? 'htmlInvokerLambda' : 'invokerLambda';
  } else if (createDbTemplate) {
    templateType = createHtmlTemplate ? 'htmlDbLambda' : 'dbLambda';
  } else {
    templateType = createHtmlTemplate ? 'htmlLambda' : 'lambda';
  }

  if (createHtmlTemplate) {
    await mkdir(lambdaName);
    await copyFile(
      `${__dirname}/../../templates/indexTemplate.html`,
      `${cwd}/${lambdaName}/index.html`,
    );
    await copyFile(
      `${__dirname}/../../templates/mainTemplate.css`,
      `${cwd}/${lambdaName}/main.css`,
    );
    await copyFile(
      `${__dirname}/../../templates/applicationTemplate.js`,
      `${cwd}/${lambdaName}/application.js`,
    );
  }

  const template = await getTemplate(templateType, includeComments);
  await writeTemplateLocally(lambdaName, template, createHtmlTemplate);
  const resource = createHtmlTemplate ? 'directory' : 'file';
  const name = createHtmlTemplate ? lambdaName : `${lambdaName}.js`;
  bamLog(msgAfterAction(resource, name, 'created'));
};
