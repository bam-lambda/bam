const fs = require('fs');
const createDirectory = require('../util/createDirectory.js');

const lambdaTemplate = fs.readFileSync('./templates/lambdaTemplate.js', 'utf8');

module.exports = function createLambda(lambdaName, path = '.') {
  // display error to warn user if lambdaName has already been used
  const alreadyExists = fs.existsSync(`${path}/bam/functions/${lambdaName}`);
  if (alreadyExists) {
    console.log(`The name ${lambdaName} is already being used. Please select another.`);
    return;
  }

  createDirectory(lambdaName, `${path}/bam/functions`);
  fs.writeFileSync(`${path}/bam/functions/${lambdaName}/index.js`, lambdaTemplate);
};
