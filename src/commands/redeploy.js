const updateLambda = require('../aws/updateLambda.js');
const getUserInput = require('../util/getUserInput.js');
const { writeLambda } = require('../util/writeToLib.js');
const deployApi = require('../aws/deployApi.js');
const { doesLambdaExist, doesApiExist } = require('../aws/doesResourceExist.js');
const getLambda = require('../aws/getLambda.js');
const fs = require('fs');
const rimraf = require('rimraf');
const asyncRimRaf = dir => new Promise(res => rimraf(dir, res));
const {
  bamLog,
  bamWarn,
  bamError,
  bamSpinner,
  spinnerCleanup,
} = require('../util/fancyText.js');

// redeploys lambda that already exists on AWS, whether or not local directory exists
module.exports = async function redeploy(lambdaName, path) { // currently updates code only (not role)
  if (!lambdaName) {
    bamError('bam redeploy [lambdaName]: lambdaName must be the name of a .js file in the current directory');
    return;
  }
  // check if lambdaName.js exists in current working dir
  const cwd = process.cwd();
  if (!fs.existsSync(`${cwd}/${lambdaName}.js`)) {
    bamError(`No such file ${lambdaName}.js in current directory ${cwd}`);
    return;
  }

  // check if lambdaName in AWS
  const existsCloud = await doesLambdaExist(lambdaName);

  if (!existsCloud) {
    bamWarn(`Function "${lambdaName}" not found on AWS. Recommend using "bam deploy ${lambdaName}" instead of redeploy`);
    return;
  }

  // check if lambdaName in ~/.bam/functions
  const existsLocally = fs.existsSync(`${path}/.bam/functions/${lambdaName}`);  

  // helper methods

  // overwrite local deployment package if redeploy successful
  const overwriteLocalPkg = async () => {
    if (existsLocally) await asyncRimRaf(`${path}/.bam/functions/${lambdaName}`);
    fs.renameSync(`${path}/.bam/functions/${lambdaName}-temp`, `${path}/.bam/functions/${lambdaName}`);
  }

  // write to library if lambda was not locally tracked
  const syncLocalToCloudLambda = async () => {
    if (!existsLocally) {     
      const { Configuration } = await getLambda(lambdaName);
      await writeLambda(Configuration, path);
    }
  }

  // create and integrate fresh new api gateway if lambda is not locally tracked
  // or if lambda exists locally but api doesn't exist in cloud
  const getApiId = async () => {
    const library = JSON.parse(fs.readFileSync(`${path}/.bam/functions/library.json`));   
    return library[lambdaName] && library[lambdaName].api && library[lambdaName].api.restApiId;
  };

  const provideNewApiIfNeeded = async () => {
    const apiId = await getApiId();
    const apiExists = await doesApiExist(apiId);
    if (!existsLocally || !apiId || !apiExists) {     
      deployApi(lambdaName, path);
    }
  };

  // revert to prior state (i.e. remove temp package) if AWS error
  const revertToPriorState = async () =>{
    await asyncRimRaf(`${path}/.bam/functions/${lambdaName}-temp`);
  };

  // update lambda code
  const data = await updateLambda(lambdaName, path);

  if (data) {
    await overwriteLocalPkg();
    await syncLocalToCloudLambda(); // lambda should be written to lib by now  
    await provideNewApiIfNeeded();
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    revertToPriorState();
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud. Reverted to previous local state`);
  }
};
