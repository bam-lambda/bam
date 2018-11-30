const AWS = require('aws-sdk');
const { promisify } = require('util');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const {
  writeApi,
  readConfig,
  readFile,
} = require('../util/fileUtils');

const {
  bamLog,
  bamError,
} = require('../util/logger');

const apiVersion = 'latest';

module.exports = async function deployApi(lambdaName, path, httpMethods, stageName) {
  const config = await readConfig(path);
  const { region } = config;
  const api = new AWS.APIGateway({ apiVersion, region });

  // sdk promises
  const asyncCreateApi = promisify(api.createRestApi.bind(api));
  const asyncGetResources = promisify(api.getResources.bind(api));
  const asyncCreateDeployment = promisify(api.createDeployment.bind(api));

  bamSpinner.start();

  // deploy sequence:
  try {
    // create rest api
    const restApiId = (await asyncCreateApi({ name: lambdaName })).id;

    // get resource
    const resourceId = (await asyncGetResources({ restApiId })).items[0].id;

    for (let i = 0; i < httpMethods.length; i += 1) {
      const httpMethod = httpMethods[i];
      const params = [httpMethod, resourceId, restApiId, lambdaName, path];
      await bamBam(createApiGatewayIntegration, {
        params,
        retryError: 'TooManyRequestsException',
      });
    }

    // create deployment
    await bamBam(asyncCreateDeployment, {
      params: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });

    // api endpoint
    const endpoint = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;

    // write to library
    await writeApi(endpoint, lambdaName, restApiId, path);
    const bamAscii = await readFile(`${__dirname}/../../ascii/bam.txt`, 'utf8');
    bamSpinner.stop();
    bamLog(bamAscii);
    bamLog('API Gateway endpoint has been deployed:');
    bamLog(endpoint);
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
