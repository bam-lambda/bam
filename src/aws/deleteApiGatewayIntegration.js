const AWS = require('aws-sdk');
const { promisify } = require('util');
const { readConfig } = require('../util/fileUtils');

const apiVersion = 'latest';

module.exports = async function deleteApiGatewayIntegration(httpMethod, resourceId, restApiId, path) { 
  const config = await readConfig(path);
  const { region, accountNumber } = config;
  const api = new AWS.APIGateway({ apiVersion, region });

  const asyncDeleteMethod = promisify(api.deleteMethod.bind(api));

  const deleteParams = {
    httpMethod,
    resourceId,
    restApiId,
  };

  await asyncDeleteMethod(deleteParams); 
};
