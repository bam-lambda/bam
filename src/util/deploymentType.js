const { lambdaExistsInCwd, lambdaFileExistsWithinDir } = require('./validations');
const {
  bamWarn,
  bamError,
  msgAfterAction,
} = require('./logger');
const getUserInput = require('./getUserInput');

module.exports = async function deploymentType (resourceName, invalidLambdaMsg, invalidDirMsg) {
  // check for lambda as file and in dir --> if both exist and are valid, ask which user wants
  // if both exist, one valid but not other, warn user and ask if they want to proceed with valid one
  // if both exist but neither valid, warn user and return 
  const fileExists = await lambdaExistsInCwd(resourceName);
  const dirExists = await lambdaFileExistsWithinDir(resourceName);
  const bothExist = fileExists && dirExists;

  let prompt;
  let proceed;
  let userResponse;
  let invalidMsg;
  let deployDir = false;
  let aborted = false;

  if (bothExist) {
console.log('both exist')    
    if (invalidLambdaMsg && invalidDirMsg) {
      invalidMsg = invalidLambdaMsg;
    } else if (invalidLambdaMsg || invalidDirMsg) {      
      prompt = invalidLambdaMsg ? 
                      `${resourceName}.js in current directory is invalid but ${resourceName} is deployable. Do you wish to deploy it? (y|n) ` :
                      `Lambda Directory ${resourceName} in current directory is invalid but ${resourceName}.js is deployable. Do you wish to deploy it? (y|n) `;
      proceed = {
        question: prompt,
        validator: (response) => (/^(y|n)$/i.test(response)),
        feedback: 'response should be either "y" or "n"',
        defaultAnswer: '',
      }
      userResponse = await getUserInput([proceed]);
      if (!/^y$/i.test(userResponse)) {
        aborted = true;
      }
      deployDir = !invalidDirMsg;
    } else {
      prompt = `Both ${resourceName} and ${resourceName}.js are valid lambdas in current directory. Which would you like to deploy? (JS|dir) `;
      proceed = {
        question: prompt,
        validator: (response) => (/^(js|dir)$/i.test(response)),
        feedback: 'response should be either "JS" or "dir"',
        defaultAnswer: '',
      }
      userResponse = await getUserInput([proceed]);
      if (!/^(js|dir)$/i.test(userResponse)) {
        aborted = true;
      }
      deployDir = /^(dir)$/i.test(userResponse);
    }
  } else if (fileExists) {
console.log('file only')    
    if (invalidLambdaMsg) {
      invalidMsg = invalidLambdaMsg;
    }
    deployDir = false;
  } else if (dirExists) {
console.log('dir only')    
    if (invalidDirMsg) {
      bamWarn(invalidDirMsg);
      return;
    }
    deployDir = true;
  } else {
console.log('neither')    
    invalidMsg = invalidLambdaMsg;
  }

  return { deployDir, invalidMsg, aborted };
}


