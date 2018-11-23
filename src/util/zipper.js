const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const StreamZip = require('node-stream-zip');

const { bamError, bamLog } = require('./fancyText');

const cwd = process.cwd();

const unzipper = async (lambdaName) => {
  const zip = new StreamZip({
    file: `${cwd}/${lambdaName}/${lambdaName}.zip`,
    storeEntries: true,
  });

  return new Promise((res) => {
    zip.on('ready', () => {
      zip.extract('index.js', `${cwd}/${lambdaName}.js`, () => {
        zip.close();
        res();
      });
    });
  });
};

const zipper = async (lambdaName, path) => {
  const dir = `${path}/.bam/functions/${lambdaName}`;

  try {
    await exec(`zip -r ${lambdaName} .`, { cwd: dir });
  } catch (err) {
    console.log(err, err.stack);
  }

  return `${dir}/${lambdaName}.zip`;
};

module.exports = { zipper, unzipper };
