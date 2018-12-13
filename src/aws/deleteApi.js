const { deleteApiFromLibraries } = require('../util/fileUtils');
const { asyncRemovePermission, asyncDeleteRestApi } = require('./awsFunctions');
const { bamError } = require('../util/logger');

module.exports = async function deleteApi(resourceName, restApiId, methodPermissionIds, path) {
  try {
    const methods = Object.keys(methodPermissionIds);

    for (let i = 0; i < methods.length; i += 1) {
      const method = methods[i];
      const { rootPermissionId, greedyPermissionId } = methodPermissionIds[method];
      await asyncRemovePermission({ FunctionName: resourceName, StatementId: rootPermissionId });
      await asyncRemovePermission({ FunctionName: resourceName, StatementId: greedyPermissionId });
    }

    await asyncDeleteRestApi({ restApiId });
    await deleteApiFromLibraries(resourceName, path);
  } catch (err) {
    bamError(err);
  }
};
