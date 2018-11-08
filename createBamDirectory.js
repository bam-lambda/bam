const fs = require('fs');

module.exports = function createBamDirectory(src) {
  const dir = `${src}/bam`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};
