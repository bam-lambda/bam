const uuid = require("uuid");

const createLambda = (lambdaName) => {
  console.log(uuid.v4());
}

module.exports = createLambda;
