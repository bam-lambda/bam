const bamSpinner = require('../util/spinner');
const { deleteApiFromLibraries } = require('../util/fileUtils');
const { asyncDeleteRestApi } = require('./awsFunctions');

module.exports = async function deleteApi(resourceName, restApiId, path) {
  await asyncDeleteRestApi({ restApiId });
  await deleteApiFromLibraries(resourceName, path);
};
