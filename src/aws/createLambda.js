const fs = require('fs');
const createDirectory = require('../util/createDirectory.js');

const lambdaTemplate = fs.readFileSync('./templates/lambdaTemplate.js', 'utf8');

module.exports = function createLambda(lambdaName, path = '.') {
  createDirectory(lambdaName, `${path}/bam/functions`);
  fs.writeFileSync(`${path}/bam/functions/${lambdaName}/index.js`, lambdaTemplate);
  console.log(`go to ${path}/bam/functions/${lambdaName}/index.js to write your lambda`);
};
