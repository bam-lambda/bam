const deleteApi = require('../aws/deleteApi');
const deleteAwsLambda = require('../aws/deleteLambda');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');
const bamSpinner = require('../util/spinner');
const { bamLog } = require('../util/logger');

const {
  readApisLibrary,
  deleteApiFromLibraries,
  deleteLambdaFromLibrary,
} = require('../util/fileUtils');

module.exports = async function destroy(lambdaName, path) {
  bamSpinner.start();

  const region = await asyncGetRegion();
  const apis = await readApisLibrary(path);
  const { restApiId } = apis[region][lambdaName];
  const optionalParamsObj = {
    asyncFuncParams: [lambdaName, restApiId, path],
    retryError: 'TooManyRequestsException',
    interval: 15000,
  };
  await bamBam(deleteApi, optionalParamsObj);
  await deleteAwsLambda(lambdaName);

  // remove from libraries
  await deleteApiFromLibraries(lambdaName, path);
  await deleteLambdaFromLibrary(lambdaName, path);
  bamSpinner.stop();
  bamLog(`Lambda "${lambdaName}" has been deleted`);
};
