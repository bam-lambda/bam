const deployLambda = require('../aws/deployLambda.js');
const deployApi = require('../aws/deployApi.js');
const { doesLambdaExist } = require('../aws/doesResourceExist.js');
const getUserInput = require('../util/getUserInput.js');
const { bamWarn } = require('../util/fancyText.js');
const { exists } = require('../util/fileUtils.js');

module.exports = async function deploy(lambdaName, path) {
  const lambdaExistsInCwd = async () => {
    const cwd = process.cwd();
    const status = await exists(`${cwd}/${lambdaName}.js`);
    return status;
  };

  const lambdaExistsInBamFunctions = async () => {
    const status = await exists(`${path}/.bam/functions/${lambdaName}`);
    return status;
  };

  const lambdaExistsOnAws = async () => {
    const status = await doesLambdaExist(lambdaName);
    return status;
  };

  const validateLambda = async () => {
    let msg = '';
    if (!(await lambdaExistsInCwd())) {
      msg = `There is no file called "${lambdaName}.js" in this directory.`;
    } else if (await lambdaExistsInBamFunctions() || await lambdaExistsOnAws()) {
      msg = `"${lambdaName}" already exists. If you are trying to overwrite this lambda, please use the "redeploy" command.`;
    }
    return msg;
  };

  const lambdaValidationMsg = await validateLambda();

  if (lambdaValidationMsg) {
    bamWarn(lambdaValidationMsg);
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
