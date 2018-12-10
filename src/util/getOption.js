module.exports = function getOption(options, optionType) {
  const optionsObj = options || {};

  return Object.keys(optionsObj).find((option) => {
    const lowercaseOption = option.toLowerCase();
    const lowercaseOptionType = optionType.toLowerCase();
    return lowercaseOption === lowercaseOptionType
      || lowercaseOption === `${lowercaseOptionType}s`;
  });
};
