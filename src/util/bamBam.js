const delay = require('./delay.js');
const { bamError } = require('./fancyText.js');

module.exports = async function bamBam(asyncCallback, params, retryError = 'InvalidParameterValueException') {
  try {
    const data = await asyncCallback(params);
    return data;
  } catch (err) {
    if (err.code === retryError) {
      await delay(3000);
      const deployed = await bamBam(asyncCallback, params, retryError);
      return deployed;
    }
    bamError(err, err.stack);
  }
};
