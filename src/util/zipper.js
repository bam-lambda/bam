const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const packageTemplateObj = {
  dependencies: {},
};

async function zipper(lambdaName, path) {
  const isNativeModule = (name) => {
    const nativeModules = Object.keys(process.binding('natives'));
    return !(nativeModules.indexOf(name) === -1);
  };

  const npmDependencies = () => {
    const lambdaFile = fs.readFileSync(`${path}/bam/functions/${lambdaName}/index.js`, 'utf8');
    const dependencies = lambdaFile.match(/require\([^)]+\)/) || [];
    return dependencies.map(pkg => pkg.slice(9, -2)).filter(pkg => !isNativeModule(pkg));
  };

  const dir = `${path}/bam/functions/${lambdaName}`;
  const packages = npmDependencies();

  const installPackages = async () => {
    for (let i = 0; i < packages.length; i += 1) {
      await exec(`npm install ${packages[i]}`, { cwd: dir });
    }
  };

  if (packages.length) {
    const packageFilePath = `${dir}/package.json`;

    if (!fs.existsSync(packageFilePath)) {
      const templateJson = JSON.stringify(packageTemplateObj);
      fs.writeFileSync(packageFilePath, templateJson);
    }

    await installPackages();
    // TODO: zip all together
  } else {
    // await exec(`zip -r ${lambdaName} index.js`, { cwd: dir });
  }

  console.log(`zipped file was created at ${dir}/${lambdaName}.zip`);
  return `${dir}/${lambdaName}.zip`;
}

zipper('lambdaDambda', '.');
