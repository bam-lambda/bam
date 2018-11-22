const deleteApi = require('../aws/deleteApi.js');
const bamBam = require('../util/bamBam.js');
const deleteAwsLambda = require('../aws/deleteLambda');

const {
  bamLog,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

const {
  promisifiedRimraf,
  readFuncLibrary,
  writeFuncLibrary,
  unlink,
  exists,
} = require('../util/fileUtils');

const cwd = process.cwd();

module.exports = async function destroy(lambdaName, path) {
  const spinnerInterval = bamSpinner();

  const library = await readFuncLibrary(path);
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
    await promisifiedRimraf(`${path}/.bam/functions/${lambdaName}`);
    const lambdaFileExists = await exists(`${cwd}/${lambdaName}.js`);

    if (lambdaFileExists) {
      await unlink(`${cwd}/${lambdaName}.js`);
    }
  } catch (err) {
    bamError(err);
  }

  // read from library and remove property
  delete library[lambdaName];

  // write back to library
  await writeFuncLibrary(path, library);

  clearInterval(spinnerInterval);
  spinnerCleanup();
  bamLog(`Lambda "${lambdaName}" has been deleted`);
};
