const deleteApi = require('../aws/deleteApi');
const deleteAwsLambda = require('../aws/deleteLambda');
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
  let warningMsg = '';

  const deleteTable = async () => {
    const tableExists = await doesTableExist(resourceName);
    if (tableExists) {
      await deleteDbTable(resourceName);
      await deleteTableFromLibrary(resourceName, path);
      if (deletionMsg) deletionMsg += '\n';
      deletionMsg += msgAfterAction('table', resourceName, 'deleted');
      return;
    }

    if (warningMsg) warningMsg += '\n';
    warningMsg += msgAfterAction('table', resourceName, 'exist', 'does not');
  };

  const deleteEndpoint = async () => {
    let restApiId;
    let methodPermissionIds;
    const apis = await readApisLibrary(path);
    const api = apis[region][resourceName];
    if (api) ({ restApiId, methodPermissionIds } = api);
    const endpointExists = await doesApiExist(restApiId);

    if (endpointExists) {
      await deleteApi(resourceName, restApiId, methodPermissionIds, path);
      await deleteApiFromLibraries(resourceName, path);
      if (deletionMsg) deletionMsg += '\n';
      deletionMsg += msgAfterAction('endpoint', resourceName, 'deleted');
      return;
    }

    if (warningMsg) warningMsg += '\n';
    warningMsg += msgAfterAction('endpoint', resourceName, 'exist', 'does not');
  };

  const deleteLambda = async () => {
    const lambdaExists = await doesLambdaExist(resourceName);
    if (lambdaExists) {
      await deleteAwsLambda(resourceName);
      await deleteLambdaFromLibrary(resourceName, path);
      if (deletionMsg) deletionMsg += '\n';
      deletionMsg += msgAfterAction('lambda', resourceName, 'deleted');
      return;
    }

    if (warningMsg) warningMsg += '\n';
    warningMsg += msgAfterAction('lambda', resourceName, 'exist', 'does not');
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
