module.exports = function handleArgs(args) {
  const lambdaName = args[0];
  const options = {};
  const formattedOptions = args.slice(1)
    .join(' ')
    .split('--')
    .slice(1)
    .map(elements => elements.trim());

  formattedOptions.forEach((optionStr) => {
    const [key, ...values] = optionStr.split(' ');
    options[key] = values;
  });

  return {
    lambdaName,
    options,
  };
};
