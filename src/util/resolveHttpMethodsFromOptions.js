const { asyncGetResources } = require('../aws/awsFunctions');

module.exports = async function resolveHttpMethodsFromOptions(options, restApiId, path) {
  let addMethods = options.methods || options.method;
  let removeMethods = options.rmMethods || options.rmMethod;
  let existingMethods = [];

  addMethods = addMethods
    ? distinctElements(addMethods.map(m => m.toUpperCase())) : [];

  removeMethods = removeMethods
    ? distinctElements(removeMethods.map(m => m.toUpperCase())) : [];

  const data = await asyncGetResources({ restApiId });
  if (data) {
    const resources = data.items
    const resource = resources.find(res => res.path === '/');
    existingMethods = Object.keys(resource.resourceMethods || {});
  }

  return { existingMethods, addMethods, removeMethods };
};
