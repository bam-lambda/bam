const createDirectory = require('./createDirectory.js');
const createJSONFile = require('./createJSONFile.js');
const configTemplate = require('../../templates/configTemplate.js');

module.exports = function init(roleName, path = '.') {
  const configJSON = configTemplate(roleName);
  createDirectory('bam', path);
  createDirectory('functions', `${path}/bam`);
  createJSONFile('config', `${path}/bam`, configJSON);
  createJSONFile('library', `${path}/bam/functions`, {});
};
