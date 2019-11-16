const restoreCursor = require('restore-cursor');

const { resetStyledText } = require('./fancyText');

const { resetCursorPosition, hideCursorAndWriteBamText } = require('./logger');

const bamSpinner = (() => {
  restoreCursor();

  let intervalId = null;

  const spinner = () => {
    const spinnerChars = '|/-\\';
    let i = 0;

    intervalId = setInterval(() => {
      const spinnerChar = spinnerChars[i % 4];
      resetCursorPosition();
      hideCursorAndWriteBamText(spinnerChar);
      i += 1;
    }, 200);

    resetStyledText();
  };

  return {
    start() {
      this.stop();
      spinner();
    },
    stop() {
      clearInterval(intervalId);
      resetCursorPosition();
      resetStyledText();
    },
  };
})();

module.exports = bamSpinner;
