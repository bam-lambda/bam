const deployLambda = require('../aws/deployLambda');
const deployApi = require('../aws/deployApi');
const getUserInput = require('../util/getUserInput');
const { bamWarn } = require('../util/logger');
const { validateLambdaDeployment } = require('../util/validateLambda');

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

  try {
    const input = await getUserInput([question]);
    if (input === undefined) {
      bamWarn('Lambda deployment aborted');
      return;
    } else {
      const [description] = input;
      await deployLambda(lambdaName, description, path);
      await deployApi(lambdaName, path);
    }
  } catch (err) {
    bamWarn(err);
  }
};
