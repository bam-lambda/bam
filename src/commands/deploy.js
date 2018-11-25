const deployLambda = require('../aws/deployLambda.js');
const getUserInput = require('../util/getUserInput');
const deployApi = require('../aws/deployApi.js');

module.exports = async function deploy(lambdaName, path) {
  const question = {
    question: 'Please give a brief description of your lambda: ',
    validator: () => (true),
    feedback: 'invalid description',
    defaultAnswer: '',
  };
  const [description] = await getUserInput([question]);
  await deployLambda(lambdaName, description, path);
  await deployApi(lambdaName, path);
};
