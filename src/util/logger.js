const { log } = console;
const { stdout } = process;

const {
  getStyledText,
  resetStyledText,
  warningColor,
  errorColor,
  bamTextStyles,
  hideCursor,
  resetCursor,
} = require('./fancyText');

const resetCursorPosition = () => stdout.cursorTo(0);

const padding = (level, char = ' ') => char.repeat(level);
const indent = padding(2);
const indentFurther = padding(4);
const indentFurthest = padding(6);
const vertPadding = padding(2, '\n');

const bamText = text => getStyledText(text, ...bamTextStyles);
const bamWarnText = text => getStyledText(text, warningColor);
const bamErrorText = text => getStyledText(text, errorColor);

const logInColor = (text, color) => log(getStyledText(text, color));
const bamWrite = text => stdout.write(bamText(text));
const bamLog = text => log(bamText(text));
const bamWarn = text => log(bamWarnText(text));
const bamError = text => log(bamErrorText(text));

const hideCursorAndWriteBamText = (text) => {
  const bamifiedText = bamText(text);
  stdout.write(`${resetCursor}${bamifiedText}${hideCursor}`);
};

const bamSpinner = (() => {
  let intervalId = null;

  const spinner = () => {
    const spinnerChars = ['|', '/', '-', '\\'];
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

// attach user callback to the process event emitter
// if no callback, it will still exit gracefully on Ctrl-C
process.on('cleanup', () => {
  bamSpinner.stop();
});

// do app specific cleaning before exiting
process.on('exit', () => {
  process.emit('cleanup');
});

// catch ctrl+c event and exit normally
process.on('SIGINT', () => {
  log('Ctrl-C...');
  process.exit(2);
});

// catch uncaught exceptions, trace, then exit normally
process.on('uncaughtException', (e) => {
  bamError('Uncaught Exception...');
  log(e.stack);
  process.exit(1);
});

module.exports = {
  log,
  logInColor,
  bamWrite,
  bamLog,
  bamWarn,
  bamText,
  bamError,
  bamSpinner,
  resetCursorPosition,
  indent,
  indentFurther,
  indentFurthest,
  vertPadding,
};



(async () => {
  const delay  = require('./delay');
  bamSpinner.start();
  await delay(3000);
  bamSpinner.stop();
  console.log('hi');
})();
