const { readFile } = require('../util/fileUtils.js');

module.exports = async function version() {
  const packageJSON = await readFile(`${__dirname}/../../package.json`);
  const packageJSONText = JSON.parse(packageJSON);
  const versionNumber = packageJSONText.version;
  console.log(versionNumber);
};
