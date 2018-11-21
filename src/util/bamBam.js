const delay = require('./delay.js');
const { bamError, bamLog } = require('./fancyText.js');

module.exports = async function bamBam(asyncCallback, { params = [], retryError = 'InvalidParameterValueException', interval = 3000 } = { retryError: 'InvalidParameterValueException', interval: 3000 }) {
  try {
    const data = await asyncCallback(...params);
    console.log(data);
    return data;
  } catch (err) {
    console.log(retryError, interval, err.code)
    if (err.code === retryError) {
      bamLog('AWS is causing a delay. This will not take more than a minute.');
      await delay(interval);
      const deployed = await bamBam(asyncCallback, { params, retryError, interval });
      return deployed;
    }
    bamError(err, err.stack);
  }
};
