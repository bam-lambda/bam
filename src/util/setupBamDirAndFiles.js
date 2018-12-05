const { createDirectory, createJSONFile } = require('./fileUtils');
const configTemplate = require('../../templates/configTemplate');

const regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'sa-east-1'];

const startingTemplate = regions.reduce((acc, region) => {
  acc[region] = {};
  return acc;
}, {});

module.exports = async function setupBamDirAndFiles(roleName, path) {
  const configJSON = await configTemplate(roleName);
  await createDirectory('.bam', path);
  await createDirectory('functions', `${path}/.bam`);
  await createJSONFile('config', `${path}/.bam`, configJSON);
  await createJSONFile('lambdas', `${path}/.bam`, startingTemplate);
  await createJSONFile('apis', `${path}/.bam`, startingTemplate);
  await createJSONFile('dbTables', `${path}/.bam`, startingTemplate);
};
