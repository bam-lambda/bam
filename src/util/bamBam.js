const delay = require('./delay.js');
const { bamError, bamLog } = require('./fancyText.js');

module.exports = async function bamBam(asyncCallback, {
  params = [],
  retryError = 'InvalidParameterValueException',
  interval = 3000,
  calls = 0,
} = { retryError: 'InvalidParameterValueException', interval: 3000, calls: 0 }) {
  try {
    const data = await asyncCallback(...params);
    return data;
  } catch (err) {
    if (err.code === retryError) {
      if (err.code === 'TooManyRequestsException' && calls === 0) {
        process.stdout.cursorTo(0);
        bamLog('AWS is causing a delay. This will not take more than a minute.');
      }

      await delay(interval);
      const deployed = await bamBam(asyncCallback, {
        params,
        retryError,
        interval,
        calls: calls + 1,
      });
      return deployed;
    }
    bamError(err, err.stack);
  }
};
