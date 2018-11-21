const fs = require('fs');

module.exports = function version() {
  const packageJSONText = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`));
  const versionNumber = packageJSONText.version;
  console.log(versionNumber);
};
