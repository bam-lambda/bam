const delay = require('./delay.js');

module.exports = async function bamBam(asyncCallback, params, actionStr, successStr, retryError = 'InvalidParameterValueException') {
  try {
    console.log(`trying to ${actionStr}`);
    const data = await asyncCallback(params);
    console.log(`success: ${successStr}`);
    return data;
  } catch (err) {
    if (err.code === retryError) {
      await delay(3000);
      const deployed = await bamBam(asyncCallback, params, actionStr, successStr, retryError);
      return deployed;
    }

    console.log(err, err.stack);
  }
};
