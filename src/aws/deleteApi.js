const fs = require('fs');
const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('../util/getRegion.js');

module.exports = async function deleteApi(restApiId, path = '.') {
  const region = getRegion();
  const apiVersion = 'latest';

  // delete from AWS
  const api = new AWS.APIGateway({ apiVersion, region });
  const asyncDeleteRestApi = promisify(api.deleteRestApi.bind(api, { restApiId }));
  await asyncDeleteRestApi();

  // read from library and remove property
  const functions = JSON.parse(fs.readFileSync(`${path}/bam/functions/library.json`));
  const lambda = Object.values(functions).find(obj => obj.api && obj.api.restApiId === restApiId);
  delete lambda.api;
  // write back to library
  fs.writeFileSync(`${path}/bam/functions/library.json`, JSON.stringify(functions));
  console.log('API Gateway endpoint has been deleted');
};
