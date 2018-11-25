const deployLambda = require('../aws/deployLambda.js');
const getUserInput = require('../util/getUserInput.js');
const deployApi = require('../aws/deployApi.js');
const { bamWarn } = require('../util/fancyText.js');

module.exports = async function deploy(lambdaName, path) {
  const question = {
    question: 'Please give a brief description of your lambda: ',
    validator: () => (true),
    feedback: 'invalid description',
    defaultAnswer: '',
  };
  const input = await getUserInput([question]);
  if (input === undefined) {
    bamWarn('Lambda deployment aborted');
    return;
  } else {
    const [description] = input;
    await deployLambda(lambdaName, description, path);
    await deployApi(lambdaName, path);
  }
};
