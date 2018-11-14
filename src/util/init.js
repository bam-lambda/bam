const createDirectory = require('./createDirectory.js');
const createJSONFile = require('./createJSONFile.js');
const configTemplate = require('./configTemplate.js');

const defaultRole = 'defaultBamRole';
const configJSON = configTemplate(defaultRole);

module.exports = async function init() {
  createDirectory('bam', '.');
  createDirectory('functions', './bam');
  createJSONFile('config', './bam', configJSON);
  createJSONFile('library', './bam/functions', {});
};
