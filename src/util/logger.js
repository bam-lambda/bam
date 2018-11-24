require('./cleanUpOnExit.js');

const { log } = console;

const {
  getStyledText,
  resetStyledText,
} = require('./fancyText');

const bamTextStyles = ['green', 'bright'];
const resetCursorPosition = () => process.stdout.cursorTo(0);

const bamText = text => getStyledText(text, ...bamTextStyles);
const bamWarnText = text => getStyledText(text, 'yellow');
const bamErrorText = text => getStyledText(text, 'red');

const bamWrite = text => process.stdout.write(bamText(text));
const bamLog = text => log(bamText(text));
const bamWarn = text => log(bamWarnText(text));
const bamError = text => log(bamErrorText(text));

const bamSpinner = (() => {
  let intervalId = null;
  const spinner = () => {
    const spinnerChars = ['|', '/', '-', '\\'];
    let i = 0;

    return setInterval(() => {
      resetCursorPosition();
      const spinnerChar = getStyledText(spinnerChars[i % 4], 'showCursor', 'hideCursor');
      bamWrite(spinnerChar);
      i += 1;
    }, 200);
  };

  return {
    start() {
      this.stop();
      intervalId = spinner();
    },
    stop() {
      resetCursorPosition();
      resetStyledText();
      clearInterval(intervalId);
    },
  };
})();

module.exports = {
  log,
  bamWrite,
  bamLog,
  bamWarn,
  bamError,
  bamSpinner,
  resetCursorPosition,
};
