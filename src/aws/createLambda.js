const fs = require('fs');
const createDirectory = require('../util/createDirectory.js');

const lambdaTemplate = fs.readFileSync('./templates/lambdaTemplate.js', 'utf8');

module.exports = function createLambda(lambdaName, src) {
  createDirectory(lambdaName, `${src}/bam/functions`);
  fs.writeFileSync(`${src}/bam/functions/${lambdaName}/index.js`, lambdaTemplate);
  console.log(`go to ${src}/bam/functions/${lambdaName}/index.js to write your lambda`);
};
