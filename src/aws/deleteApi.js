const { deleteApiFromLibraries } = require('../util/fileUtils');
const { asyncRemovePermission, asyncDeleteRestApi } = require('./awsFunctions');

module.exports = async function deleteApi(resourceName, restApiId, methodPermissionIds, path) {
  Object.keys(methodPermissionIds).forEach(async (method) => {
    const { rootPermissionId, greedyPermissionId } = methodPermissionIds[method];
    await asyncRemovePermission({ FunctionName: resourceName, StatementId: rootPermissionId });
    await asyncRemovePermission({ FunctionName: resourceName, StatementId: greedyPermissionId });
  });

  await asyncDeleteRestApi({ restApiId });
  await deleteApiFromLibraries(resourceName, path);
};
