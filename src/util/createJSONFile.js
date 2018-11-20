const fs = require('fs');

module.exports = function createJSONFile(fileName, path = '.', json) {
  const configStr = JSON.stringify(json);
  fs.writeFileSync(`${path}/${fileName}.json`, configStr);
};
