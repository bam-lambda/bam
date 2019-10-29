const { asyncGetFunction } = require('./awsFunctions');

module.exports = async function getLambdaConfig(lambdaName) {
  try {
    const data = await asyncGetFunction({ FunctionName: lambdaName });
    return data.Configuration;
  } catch (err) {
    return err;
  }
};
