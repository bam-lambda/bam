const fs = require('fs');
const createDirectory = require('../util/createDirectory.js');

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
