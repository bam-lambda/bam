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
const { asyncGetRegion } = require('../util/getRegion');
const {
  bamLog,
  bamError,
} = require('../util/logger');

module.exports = async function deployApi(lambdaName, path, httpMethods, stageName) {
  const region = await asyncGetRegion();
  bamSpinner.start();

  // deploy sequence:
  try {
    // create rest api
    const restApiId = (await asyncCreateApi({ name: lambdaName })).id;

    // get resource
    const resourceId = (await asyncGetResources({ restApiId })).items[0].id;

    for (let i = 0; i < httpMethods.length; i += 1) {
      const httpMethod = httpMethods[i];
      await createApiGatewayIntegration(httpMethod, resourceId, restApiId, lambdaName, path);
    }

    // create deployment
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });

    // api endpoint
    const endpoint = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;

    // write to libraries
    await writeApi(endpoint, httpMethods, lambdaName, restApiId, path);
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
