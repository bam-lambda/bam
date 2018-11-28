const AWS = require('aws-sdk');
const { promisify } = require('util');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');

const {
  writeApi,
  readConfig,
  readFile,
} = require('../util/fileUtils');

const {
  bamLog,
  bamSpinner,
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
  const asyncCreateResource = promisify(api.createResource.bind(api));
  const asyncCreateDeployment = promisify(api.createDeployment.bind(api));

  bamSpinner.start();

  // Sequence:
  try {
    // create rest api
    const restApiId = (await asyncCreateApi({ name: lambdaName })).id;

    // get resources
    const parentId = (await asyncGetResources({ restApiId })).items[0].id;

    // create resource
    const createResourceParams = { restApiId, parentId, pathPart: lambdaName };
    const resourceId = (await asyncCreateResource(createResourceParams)).id;

    for (let i = 0; i < httpMethods.length; i += 1) {
      const httpMethod = httpMethods[i];
      await createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, path);
    }

    // create deployment
    await asyncCreateDeployment({ restApiId, stageName });

    // api endpoint
    const endpoint = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}/${lambdaName}`;

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
