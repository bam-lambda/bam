const fs = require('fs');

module.exports = function createDirectory(name, path = '.') {
  const dir = `${path}/${name}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};
