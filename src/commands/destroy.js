const deleteApi = require('../aws/deleteApi');
const deleteAwsLambda = require('../aws/deleteLambda');
const bamBam = require('../util/bamBam');
const { asyncGetRegion } = require('../util/getRegion');
const bamSpinner = require('../util/spinner');
const { bamLog, bamWarn } = require('../util/logger');
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

  const getDeletionMessage = (resourceType) => {
    if (resourceType === 'both') {
      return `Lambda and endpoint "${resourceName}" have been deleted`;
    }

    return `${resourceType}: "${resourceName}" has been deleted`;
  };

  const deleteTable = async () => {
    const tableExists = await doesTableExist(resourceName);
    if (tableExists) {
      await deleteDbTable(resourceName);
      await deleteTableFromLibrary(resourceName, path);
      bamLog(`"${resourceName}" table has been deleted`);
    } else {
      bamWarn(`"${resourceName}" table does not exist on AWS`);
    }
  };

  const deleteEndpoint = async () => {
    const endpointExists = await doesApiExist(resourceName);
    if (endpointExists) {
      const apis = await readApisLibrary(path);
      const { restApiId } = apis[region][resourceName];
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
    deletionMsg = getDeletionMessage('Table');
  } else if (destroyLambda) {
    await deleteLambda();
    deletionMsg = getDeletionMessage('Lambda');
  } else if (destroyEndpoint) {
    await deleteEndpoint(resourceName);
    deletionMsg = getDeletionMessage('Endpoint');
  } else {
    await deleteEndpoint(resourceName);
    await deleteAwsLambda(resourceName);
    deletionMsg = getDeletionMessage('both');
  }

  bamSpinner.stop();
  bamLog(deletionMsg);
};
