const updateLambda = require('../aws/updateLambda.js');
const getUserInput = require('../util/getUserInput.js');
const deployApi = require('../aws/deployApi.js');
const { doesLambdaExist } = require('../aws/doesResourceExist.js');
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

  // check if lambdaName in ~/.bam/functions
  const existsLocally = fs.existsSync(`${path}/.bam/functions/${lambdaName}`);

  if (!existsLocally) {
    bamWarn(`Bam is not locally tracking any function "${lambdaName}". Recommend using "bam deploy ${lambdaName}" instead of redeploy`);
  }

  // check if lambdaName in AWS
  const existsCloud = await doesLambdaExist(lambdaName);

  if (!existsCloud) {
    bamWarn(`Function "${lambdaName}" not found on AWS. Recommend using "bam deploy ${lambdaName}" instead of redeploy`);
    return;
  }

  // helper methods

  // overwrite local deployment package if redeploy successful
  const overwriteLocalPkg = async () => {
    if (existsLocally) await asyncRimRaf(`${path}/.bam/functions/${lambdaName}`);
    fs.renameSync(`${path}/.bam/functions/${lambdaName}-temp`, `${path}/.bam/functions/${lambdaName}`);
  }

  // revert to prior state (i.e. remove temp package) if AWS error
  const revertToPriorState = async () =>{
    await asyncRimRaf(`${path}/.bam/functions/${lambdaName}-temp`);
  };

  // update lambda code
  const data = await updateLambda(lambdaName, path);

  if (data) {
    await overwriteLocalPkg();
    bamLog(`Lambda "${lambdaName}" has been updated`);
  } else {
    revertToPriorState();
    bamError(`Lambda "${lambdaName}" could not be updated in the cloud. Reverted to previous local state`);
  }
};



