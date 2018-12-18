const uuid = require('uuid');

const createApiGatewayIntegration = require('./createApiGatewayIntegration');
const bamBam = require('../util/bamBam');
const bamSpinner = require('../util/spinner');
const { asyncGetRegion } = require('../util/getRegion');

const {
  asyncCreateApi,
  asyncGetResources,
  asyncCreateResource,
  asyncCreateDeployment,
} = require('./awsFunctions');

const {
  bamLog,
  msgAfterAction,
  bamError,
} = require('../util/logger');

module.exports = async function deployApi(resourceName, path, httpMethods, stageName) {
  const region = await asyncGetRegion();
  bamSpinner.start();

  // deploy sequence:
  try {
    // create rest api
    const restApiId = (await asyncCreateApi({ name: resourceName })).id;

    // get root resource
    const rootResourceId = (await asyncGetResources({ restApiId })).items[0].id;

    const createResourceParams = {
      parentId: rootResourceId,
      pathPart: '{proxy+}',
      restApiId,
    };

    // create greedy path resource to allow path params
    const greedyPathResourceId = (await asyncCreateResource(createResourceParams)).id;

    const methodPermissionIds = {};
    for (let i = 0; i < httpMethods.length; i += 1) {
      const httpMethod = httpMethods[i];
      const rootPath = '/';
      const greedyPath = '/*';
      const rootPermissionId = uuid.v4();
      const greedyPermissionId = uuid.v4();
      methodPermissionIds[httpMethod] = {
        rootPermissionId,
        greedyPermissionId,
      };

      // root resource
      const rootIntegrationParams = {
        httpMethod,
        restApiId,
        resourceName,
        path,
        resourceId: rootResourceId,
        statementId: rootPermissionId,
        apiPath: rootPath,
      };
      await createApiGatewayIntegration(rootIntegrationParams);

      // greedy path
      const greedyIntegrationParams = {
        httpMethod,
        restApiId,
        resourceName,
        path,
        resourceId: greedyPathResourceId,
        statementId: greedyPermissionId,
        apiPath: greedyPath,
      };
      await createApiGatewayIntegration(greedyIntegrationParams);
    }

    // create deployment
    await bamBam(asyncCreateDeployment, {
      asyncFuncParams: [{ restApiId, stageName }],
      retryError: 'TooManyRequestsException',
    });

    const endpoint = `https://${restApiId}.execute-api.${region}.amazonaws.com/${stageName}`;

    bamSpinner.stop();
    bamLog(msgAfterAction('endpoint', resourceName, 'created'));
    bamLog(endpoint);

    return {
      restApiId,
      endpoint,
      methodPermissionIds,
    };
  } catch (err) {
    bamSpinner.stop();
    bamError(err);
  }
};
