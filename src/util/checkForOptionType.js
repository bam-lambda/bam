module.exports = function checkForOptionType(options, type) {
  const optionsKeys = Object.keys(options || {});
  const regEx = new RegExp(`${type.toLowerCase()}`);
  return optionsKeys.some(optionKey => regEx.test(optionKey.toLowerCase()));
};
