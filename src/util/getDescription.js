const {
  readFile,
  getStagingPath,
} = require('./fileUtils');


const getLambdaFileAboveExport = (lambdaFile) => {
  const lambdaFileParts = lambdaFile.split('exports');
  return lambdaFileParts.length > 1 ? lambdaFileParts[0] : '';
};

const getDescriptionFromLambdaFile = async (lambdaFile) => {
  const descriptionStr = '// description:';
  const descriptionRegEx = new RegExp(`${descriptionStr}.*`);

  const lambdaFileAboveExport = getLambdaFileAboveExport(lambdaFile);
  const descriptionArr = lambdaFileAboveExport.match(descriptionRegEx) || [];

  if (descriptionArr.length) {
    return descriptionArr[0].split(descriptionStr).join('').trim().slice(0, 255);
  }

  return '';
};

module.exports = async function getDescription(lambdaName, path) {
  const stagingPath = getStagingPath(path);
  const lambdaFile = await readFile(`${stagingPath}/${lambdaName}/index.js`, 'utf8');
  const lambdaDescription = await getDescriptionFromLambdaFile(lambdaFile);

  return lambdaDescription;
};
