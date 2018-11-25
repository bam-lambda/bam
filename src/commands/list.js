const { readFuncLibrary } = require('../util/fileUtils');
const { bamText, log } = require('../util/logger');

module.exports = async function list(path) {
  const indent = ' '.repeat(4);
  const padding = char => char.repeat(2);
  const horizPadding = padding(' ');
  const vertPadding = padding('\n');

  const library = await readFuncLibrary(path);
  const functionsList = Object.keys(library).map((funcName) => {
    const funcObj = library[funcName];
    const funcNameStr = bamText(`${funcName}:`);
    const descriptionStr = `${indent}${bamText('description:')} ${funcObj.description}`;
    const endpointStr = `${indent}${bamText('url:')} ${funcObj.api.endpoint}`;
    const fields = [funcNameStr, descriptionStr, endpointStr];
    return fields.join('\n');
  }).join(`${vertPadding}${horizPadding}`);

  const paddedFunctionsList = `${horizPadding}${functionsList}`;

  log(`\n${paddedFunctionsList}\n`);
};
