const AWS = require('aws-sdk');
const { promisify } = require('util');
const uuid = require('uuid');
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

module.exports = async function deployApi(lambdaName, path, stageName = 'dev') {
  const config = await readConfig(path);
  const { region, accountNumber } = config;
  const lambda = new AWS.Lambda({ apiVersion, region });
  const api = new AWS.APIGateway({ apiVersion, region });

  const httpMethod = 'GET';

  // sdk promises
  const asyncCreateApi = promisify(api.createRestApi.bind(api));
  const asyncGetResources = promisify(api.getResources.bind(api));
  const asyncCreateResource = promisify(api.createResource.bind(api));
  const asyncAddPermission = promisify(lambda.addPermission.bind(lambda));
  const asyncPutMethod = promisify(api.putMethod.bind(api));
  const asyncPutIntegration = promisify(api.putIntegration.bind(api));
  const asyncPutMethodResponse = promisify(api.putMethodResponse.bind(api));
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

    // add permission to lambda
    const sourceArn = `arn:aws:execute-api:${region}:${accountNumber}:${restApiId}/*/${httpMethod}/${lambdaName}`;
    const addPermissionParams = {
      FunctionName: lambdaName,
      StatementId: uuid.v4(),
      Principal: 'apigateway.amazonaws.com',
      Action: 'lambda:InvokeFunction',
      SourceArn: sourceArn,
    };
    await bamBam(asyncAddPermission, { params: [addPermissionParams] });

    // put method
    const putMethodParams = {
      restApiId,
      resourceId,
      httpMethod,
      authorizationType: 'NONE',
    };
    await asyncPutMethod(putMethodParams);

    // put integration
    const putIntegrationParams = {
      restApiId,
      resourceId,
      httpMethod,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountNumber}:function:${lambdaName}/invocations`,
    };
    await asyncPutIntegration(putIntegrationParams);

    // put method response
    const putMethodResponseParams = {
      httpMethod,
      resourceId,
      restApiId,
      statusCode: '200',
    };
    await asyncPutMethodResponse(putMethodResponseParams);

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
