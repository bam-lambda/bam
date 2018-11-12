const createDirectory = require('./createDirectory.js');
const fs = require('fs');

const template = `exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };

  return response;
}`;

module.exports = (lambdaName, src) => {
  createDirectory(lambdaName, `${src}/bam/functions`);
  fs.writeFileSync(`${src}/bam/functions/${lambdaName}/index.js`, template);
  console.log(`go to ${src}/bam/functions/${lambdaName}/index.js to write your lambda`);
};
