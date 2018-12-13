const deleteApi = require('../aws/deleteApi');
const deleteAwsLambda = require('../aws/deleteLambda');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');
const bamSpinner = require('../util/spinner');
const { bamLog, msgAfterAction, bamWarn } = require('../util/logger');
const checkForOptionType = require('../util/checkForOptionType');
const deleteDbTable = require('../aws/deleteDbTable');
const {
  doesTableExist,
  doesLambdaExist,
  doesApiExist,
} = require('../aws/doesResourceExist');

const {
  readApisLibrary,
  deleteApiFromLibraries,
  deleteLambdaFromLibrary,
  deleteTableFromLibrary,
} = require('../util/fileUtils');

module.exports = async function destroy(resourceName, path, options) {
  bamSpinner.start();

  const destroyDb = checkForOptionType(options, 'db');
  const destroyLambda = checkForOptionType(options, 'lambda');
  const destroyEndpoint = checkForOptionType(options, 'endpoint');
  const region = await asyncGetRegion();
  let deletionMsg = '';

  const deleteTable = async () => {
    const tableExists = await doesTableExist(resourceName);
    if (tableExists) {
      await deleteDbTable(resourceName);
      await deleteTableFromLibrary(resourceName, path);
    } else {
      bamWarn(`"${resourceName}" table does not exist on AWS`);
    }
  };

  const deleteEndpoint = async () => {
    const apis = await readApisLibrary(path);
    let restApiId;
    const api = apis[region][resourceName];
    if (api) ({ restApiId } = api);
    const endpointExists = await doesApiExist(restApiId);

    if (endpointExists) {
      const optionalParamsObj = {
        asyncFuncParams: [resourceName, restApiId, path],
        retryError: 'TooManyRequestsException',
        interval: 15000,
      };
      await bamBam(deleteApi, optionalParamsObj);
      await deleteApiFromLibraries(resourceName, path);
    }
  };

  const deleteLambda = async () => {
    const lambdaExists = await doesLambdaExist(resourceName);
    if (lambdaExists) {
      await deleteAwsLambda(resourceName);
      await deleteLambdaFromLibrary(resourceName, path);
    }
  };

  if (destroyDb) {
    await deleteTable();
    deletionMsg = msgAfterAction('table', resourceName, 'deleted');
  } else if (destroyLambda) {
    await deleteLambda();
    deletionMsg = msgAfterAction('lambda', resourceName, 'deleted');
  } else if (destroyEndpoint) {
    await deleteEndpoint();
    deletionMsg = msgAfterAction('endpoint', resourceName, 'deleted');
  } else {
    await deleteEndpoint();
    deletionMsg = msgAfterAction('endpoint', resourceName, 'deleted');
    await deleteLambda();
    deletionMsg += `\n${msgAfterAction('lambda', resourceName, 'deleted')}`;
  }

  bamSpinner.stop();
  bamLog(deletionMsg);
};
