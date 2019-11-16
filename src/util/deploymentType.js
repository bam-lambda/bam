const {
  lambdaExistsInCwd,
  lambdaFileExistsWithinDir,
} = require('./validations');
const getUserInput = require('./getUserInput');

module.exports = async function deploymentType(
  resourceName,
  invalidLambdaMsg,
  invalidDirMsg,
) {
  const fileExists = await lambdaExistsInCwd(resourceName);
  const dirExists = await lambdaFileExistsWithinDir(resourceName);
  const bothExist = fileExists && dirExists;

  let prompt;
  let proceed;
  let userResponse;
  let invalidMsg;
  let deployDir = false;
  let aborted = false;

  const handleBothExist = async () => {
    if (invalidLambdaMsg && invalidDirMsg) {
      invalidMsg = invalidLambdaMsg;
    } else if (invalidLambdaMsg || invalidDirMsg) {
      prompt = invalidLambdaMsg
        ? `${resourceName}.js in current directory is invalid but ${resourceName} is deployable.`
        : `Lambda Directory ${resourceName} in current directory is invalid but ${resourceName}.js is deployable.`;
      prompt += '\nDo you wish to deploy it? (y|n) ';
      proceed = {
        question: prompt,
        validator: (response) => /^(y|n)$/i.test(response),
        feedback: 'response should be either "y" or "n"',
        defaultAnswer: '',
      };
      userResponse = await getUserInput([proceed]);
      if (!/^y$/i.test(userResponse)) aborted = true;
      deployDir = !invalidDirMsg;
    } else {
      prompt = `Both ${resourceName} directory and ${resourceName}.js file are valid lambdas in current directory.`;
      prompt += '\nWhich would you like to deploy? (file|dir) ';
      proceed = {
        question: prompt,
        validator: (response) => /^(file|dir)$/i.test(response),
        feedback: 'response should be either "file" or "dir"',
        defaultAnswer: '',
      };
      userResponse = await getUserInput([proceed]);
      if (!/^(file|dir)$/i.test(userResponse)) aborted = true;
      deployDir = /^(dir)$/i.test(userResponse);
    }
  };

  if (bothExist) {
    await handleBothExist();
  } else if (fileExists) {
    if (invalidLambdaMsg) invalidMsg = invalidLambdaMsg;
    deployDir = false;
  } else if (dirExists) {
    if (invalidDirMsg) invalidMsg = invalidDirMsg;
    deployDir = true;
  } else {
    invalidMsg = invalidLambdaMsg;
  }

  return { deployDir, invalidMsg, aborted };
};
