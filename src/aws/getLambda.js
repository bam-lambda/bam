const { asyncGetFunction } = require('./awsFunctions');

module.exports = async function getLambda(lambdaName) {
  try {
    const data = await asyncGetFunction({ FunctionName: lambdaName });
    return data;
  } catch (err) {
    return err;
  }
};
