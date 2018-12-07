const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const { readFile } = require('../util/fileUtils');
const { asyncGetRegion } = require('../util/getRegion');

const {
  asyncCreateApi,
  asyncGetResources,
  asyncCreateResource,
  asyncCreateDeployment,
} = require('./awsFunctions');

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

    // get root resource
    const rootResourceId = (await asyncGetResources({ restApiId })).items[0].id;

    const createResourceParams = {
      parentId: rootResourceId,
      pathPart: '{proxy+}',
      restApiId,
    };

    // create greedy path resource to allow path params
    const greedyPathResourceId = (await asyncCreateResource(createResourceParams)).id;

    for (let i = 0; i < httpMethods.length; i += 1) {
      const httpMethod = httpMethods[i];
      const rootPath = '/';
      const greedyPath = '/*';

      // root resource
      await createApiGatewayIntegration(httpMethod, rootResourceId, restApiId, lambdaName, rootPath, path);

      // greedy path
      await createApiGatewayIntegration(httpMethod, greedyPathResourceId, restApiId, lambdaName, greedyPath, path);
    }

    // create deployment
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });

    const endpoint = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;

    const bamAscii = await readFile(`${__dirname}/../../ascii/bam.txt`, 'utf8');
    bamSpinner.stop();
    bamLog(bamAscii);
    bamLog('API Gateway endpoint has been deployed:');
    bamLog(endpoint);
    return { restApiId, endpoint };
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
