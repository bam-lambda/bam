const deployLambda = require('../aws/deployLambda.js');
const { writeLambda } = require('../util/writeToLib.js');
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
  try {
    const input = await getUserInput([question]);
    if (input === undefined) return;
    const [description] = input;
    const lambdaData = await deployLambda(lambdaName, description, path);
    await writeLambda(lambdaData, path, description);
    await deployApi(lambdaName, path);
  } catch (err) {
    bamWarn(err);
  }
};
