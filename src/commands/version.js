const { readFile } = require('../util/fileUtils');
const { bamLog } = require('../util/logger');

module.exports = async function version() {
  const packageJSON = await readFile(`${__dirname}/../../package.json`);
  const packageJSONText = JSON.parse(packageJSON);
  const versionNumber = packageJSONText.version;
  bamLog(versionNumber);
};
