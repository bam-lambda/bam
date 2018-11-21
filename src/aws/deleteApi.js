const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('../util/getRegion.js');
const { bamLog } = require('../util/fancyText.js');
const { readFuncLibrary, writeFuncLibrary } = require('../util/fileUtils');

module.exports = async function deleteApi(restApiId, path) {
  const region = await getRegion();
  const apiVersion = 'latest';

  // delete from AWS
  const api = new AWS.APIGateway({ apiVersion, region });
  const asyncDeleteRestApi = promisify(api.deleteRestApi.bind(api, { restApiId }));
  await asyncDeleteRestApi();

  // read from library and remove property
  const functions = await readFuncLibrary(path);
  const lambda = Object.values(functions).find(obj => obj.api && obj.api.restApiId === restApiId);
  delete lambda.api;

  // write back to library
  await writeFuncLibrary(path, functions);
  bamLog('API Gateway endpoint has been deleted');
};
