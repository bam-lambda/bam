const fs = require('fs');

module.exports = function createBamDirectory() {
  const dir = './bam';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};
