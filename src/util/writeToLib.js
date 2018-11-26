const fs = require('fs');

const writeLambda = async (data, path, description='') => {
  const name = data.FunctionName;
  const arn = data.FunctionArn;

  // read contents from library
  const functions = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
  functions[name] = { arn, description };

  // write back to library
  fs.writeFileSync(`${path}/.bam/functions/library.json`, JSON.stringify(functions));
};

const writeApi = async (endpoint, lambdaName, restApiId, path) => {
  const functions = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));
  functions[lambdaName].api = { endpoint, restApiId };
  fs.writeFileSync(`${path}/.bam/functions/library.json`, JSON.stringify(functions));
//  const functions = await readFuncLibrary(path);
//  functions[lambdaName].api = { endpoint, restApiId };
//  await writeFuncLibrary(path, functions);
};

module.exports = {
  writeLambda,
  writeApi
};
