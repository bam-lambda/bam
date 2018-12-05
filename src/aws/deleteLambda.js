const { asyncLambdaDeleteFunction } = require('./awsFunctions');

module.exports = async function deleteLambda(lambdaName) {
  const lambdaDeleteParams = {
    FunctionName: lambdaName,
  };

  await asyncLambdaDeleteFunction(lambdaDeleteParams);
};
