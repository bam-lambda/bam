const AWS = require('aws-sdk');
const { promisify } = require('util');

const getRegion = require('../util/getRegion');

const bamBam = require('../util/bamBam');

module.exports = async function deleteLambda(lambdaName) {
  const region = await getRegion();
  const apiVersion = 'latest';

  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncLambdaDeleteFunction = promisify(lambda.deleteFunction.bind(lambda, {
    FunctionName: lambdaName,
  }));

  await asyncLambdaDeleteFunction();
  //await bamBam(asyncLambdaDeleteFunction, { retryError: 'TooManyRequestsException' });
};
