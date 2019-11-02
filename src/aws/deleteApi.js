const { deleteApiFromLibraries } = require('../util/fileUtils');
const { asyncRemovePermission, asyncDeleteRestApi } = require('./awsFunctions');
const bamBam = require('../util/bamBam');

module.exports = async function deleteApi(
  resourceName,
  restApiId,
  methodPermissionIds,
  path,
) {
  const methods = Object.keys(methodPermissionIds);

  for (let i = 0; i < methods.length; i += 1) {
    const method = methods[i];
    const { rootPermissionId, greedyPermissionId } = methodPermissionIds[
      method
    ];
    await asyncRemovePermission({
      FunctionName: resourceName,
      StatementId: rootPermissionId,
    });
    await asyncRemovePermission({
      FunctionName: resourceName,
      StatementId: greedyPermissionId,
    });
  }
  const optionalParamsObj = {
    asyncFuncParams: [{ restApiId }],
    retryError: 'TooManyRequestsException',
    interval: 15000,
  };

  await bamBam(asyncDeleteRestApi, optionalParamsObj);
  await deleteApiFromLibraries(resourceName, path);
};
