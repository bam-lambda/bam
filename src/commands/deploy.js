const deployLambda = require('../aws/deployLambda.js');
const deployApi = require('../aws/deployApi.js');
const getUserInput = require('../util/getUserInput.js');
const { bamWarn } = require('../util/fancyText.js');
const { validateLambdaDeployment } = require('../util/validateLambda.js');

module.exports = async function deploy(lambdaName, path) {
  const invalidLambdaMsg = await validateLambdaDeployment(lambdaName);

  if (invalidLambdaMsg) {
    bamWarn(invalidLambdaMsg);
    return;
  }

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
