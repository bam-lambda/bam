const {
  asyncCreateApi,
  asyncGetResources,
  asyncCreateDeployment,
} = require('./awsFunctions');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const {
  writeApi,
  readFile,
} = require('../util/fileUtils');
const getRegion = require('../util/getRegion');
const {
  bamLog,
  bamError,
} = require('../util/logger');

module.exports = async function deployApi(lambdaName, path, httpMethods, stageName) {
  const region = getRegion();

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
