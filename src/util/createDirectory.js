const fs = require('fs');

module.exports = function createDirectory(name, src) {
  const dir = `${src}/${name}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  console.log(`${name} directory created`);
};
