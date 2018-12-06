const bamSpinner = require('../util/spinner');
const { bamLog } = require('../util/logger');
const { deleteApiFromLibraries } = require('../util/fileUtils');
const { asyncDeleteRestApi } = require('./awsFunctions');

module.exports = async function deleteApi(resourceName, restApiId, path) {
  bamSpinner.start();
  await asyncDeleteRestApi({ restApiId });
  await deleteApiFromLibraries(resourceName, path);
  bamSpinner.stop();
  bamLog('API Gateway endpoint has been deleted');
};
