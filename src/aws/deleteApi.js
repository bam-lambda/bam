const bamSpinner = require('../util/spinner');
const { bamLog } = require('../util/logger');
const { readFuncLibrary, writeFuncLibrary } = require('../util/fileUtils');
const { asyncDeleteRestApi } = require('./awsFunctions');

module.exports = async function deleteApi(restApiId, path) {
  bamSpinner.start();

  // delete from AWS
  await asyncDeleteRestApi({ restApiId });

  // read from library and remove property
  const functions = await readFuncLibrary(path);
  const lambda = Object.values(functions).find(obj => obj.api && obj.api.restApiId === restApiId);
  delete lambda.api;

  // write back to library
  await writeFuncLibrary(path, functions);
  bamSpinner.stop();
  bamLog('API Gateway endpoint has been deleted');
};
