const fs = require('fs');
const { bamWarn } = require('../util/fancyText.js');

const lambdaTemplate = fs.readFileSync('./templates/lambdaTemplate.js', 'utf8');

module.exports = function create(lambdaName, path) {
  const cwd = process.cwd();

  // display error to warn user if lambdaName has already been used
  const alreadyExists = fs.existsSync(`${path}/.bam/functions/${lambdaName}`);
  if (alreadyExists) {
    bamWarn(`The name ${lambdaName} is already being used. Please select another.`);
    return;
  }

  fs.writeFileSync(`${cwd}/${lambdaName}.js`, lambdaTemplate);
};
