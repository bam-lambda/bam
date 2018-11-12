const fs = require('fs');

module.exports = function createJSONFile(fileName, src, json) {
  const configStr = JSON.stringify(json);
  fs.writeFileSync(`${src}/${fileName}.json`, configStr);

  console.log('JSON file created');
};
