const AWS = require('aws-sdk');
const { promisify } = require('util');
const getRegion = require('../util/getRegion');

const apiVersion = 'latest';

module.exports = async function getLambda(lambdaName) {
  const region = await getRegion();
  const lambda = new AWS.Lambda({ apiVersion, region });
  const asyncGetFunction = promisify(lambda.getFunction.bind(lambda));

  try {
    const data = await asyncGetFunction({ FunctionName: lambdaName });
    return data;
  } catch (err) {
    return err;
  }
};
