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
  let warningMsg = '';

  const getDeletionMessage = resourceType => (
    `${resourceType}: "${resourceName}" has been deleted. `
  );

  const deleteTable = async () => {
    const tableExists = await doesTableExist(resourceName);
    if (tableExists) {
      await deleteDbTable(resourceName);
      await deleteTableFromLibrary(resourceName, path);
      deletionMsg += getDeletionMessage('Table');
      return;
    }
    warningMsg += `"${resourceName}" table does not exist on AWS. `;
  };

  const deleteEndpoint = async () => {
    let restApiId;
    let methodPermissionIds;
    const apis = await readApisLibrary(path);
    const api = apis[region][resourceName];
    if (api) ({ restApiId, methodPermissionIds } = api);
    const endpointExists = await doesApiExist(restApiId);

    if (endpointExists) {
      const optionalParamsObj = {
        asyncFuncParams: [resourceName, restApiId, methodPermissionIds, path],
        retryError: 'TooManyRequestsException',
        interval: 15000,
      };
      await bamBam(deleteApi, optionalParamsObj);
      await deleteApiFromLibraries(resourceName, path);
      deletionMsg += getDeletionMessage('Endpoint');
      return;
    }
    warningMsg += `"${resourceName}" endpoint does not exist on AWS. `;
  };

  const deleteLambda = async () => {
    const lambdaExists = await doesLambdaExist(resourceName);
    if (lambdaExists) {
      await deleteAwsLambda(resourceName);
      await deleteLambdaFromLibrary(resourceName, path);
      deletionMsg += getDeletionMessage('Lambda');
      return;
    }
    warningMsg += `"${resourceName}" lambda does not exist on AWS. `;
  };

  if (destroyDb) {
    await deleteTable();
  } else if (destroyLambda) {
    await deleteLambda();
  } else if (destroyEndpoint) {
    await deleteEndpoint();
  } else {
    await deleteEndpoint();
    await deleteLambda();
  }

  bamSpinner.stop();
  if (warningMsg && deletionMsg) {
    bamLog(deletionMsg);
    bamWarn(warningMsg);
  } else if (warningMsg) {
    bamWarn(warningMsg);
  } else {
    bamLog(deletionMsg);
  }
};
