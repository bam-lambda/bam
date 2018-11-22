const fs = require('fs');
const rimraf = require('rimraf');

const deleteApi = require('../aws/deleteApi.js');
const bamBam = require('../util/bamBam.js');

const deleteAwsLambda = require('../aws/deleteLambda');
const {
  bamLog,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const cwd = process.cwd();

module.exports = async function destroy(lambdaName, path) {
  const spinnerInterval = bamSpinner();

  const library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
  const { restApiId } = library[lambdaName].api;
  const bamBamParams = {
    params: [restApiId, path],
    retryError: 'TooManyRequestsException',
    interval: 30000,
  };
  await bamBam(deleteApi, bamBamParams);
  await deleteAwsLambda(lambdaName);

  // delete from local directories
  try {
    await asyncRimRaf(`${path}/.bam/functions/${lambdaName}`);
    if (fs.existsSync(`${cwd}/${lambdaName}.js`)) {
      fs.unlinkSync(`${cwd}/${lambdaName}.js`);
    }
  } catch (err) {
    bamError(err);
  }

  // read from library and remove property
  const functions = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
  delete functions[lambdaName];

  // write back to library
  fs.writeFileSync(`${path}/.bam/functions/library.json`, JSON.stringify(functions));

  clearInterval(spinnerInterval);
  spinnerCleanup();
  bamLog(`Lambda "${lambdaName}" has been deleted`);
};
