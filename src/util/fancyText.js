/* eslint no-console: 0 */
const fs = require('fs');

const bamTextStyles = ['green', 'bright'];

class Ansi {
  constructor() {
    const escapeChar = '\x1b';
    this.codes = {
      showCursor: `${escapeChar}[?25h`,
      resetColor: `${escapeChar}[0m`,
      bright: `${escapeChar}[1m`,
      green: `${escapeChar}[32m`,
      yellow: `${escapeChar}[33m`,
      red: `${escapeChar}[31m`,
      white: `${escapeChar}[37m`,
      greenBg: `${escapeChar}[42m`,
      hideCursor: `${escapeChar}[?25l`,
    };
  }
}

const ansi = new Ansi();

const hideCursor = () => process.stdout.write(ansi.codes.hideCursor);
const showCursor = () => process.stdout.write(ansi.codes.showCursor);
const resetColor = () => process.stdout.write(ansi.codes.resetColor);

const resetStyledText = () => {
  resetColor();
  showCursor();
};

const getStyledText = (text, ...codes) => {
  const stylesStr = codes.reduce((codesStr, code) => `${codesStr}${ansi.codes[code]}`, '');
  return `${stylesStr}${text}${ansi.codes.resetColor}`;
};

const bamText = text => getStyledText(text, ...bamTextStyles);
const bamWarnText = text => getStyledText(text, 'yellow');
const bamErrorText = text => getStyledText(text, 'red');

const bamWrite = text => process.stdout.write(bamText(text));
const bamLog = text => console.log(bamText(text));
const bamWarn = text => console.log(bamWarnText(text));
const bamError = text => console.log(bamErrorText(text));

const brightGreenSpinner = () => {
  hideCursor();
  const spinnerChars = ['|', '/', '-', '\\'];
  let i = 0;

  return setInterval(() => {
    const spinnerChar = spinnerChars[i % 4];
    process.stdout.cursorTo(0);
    showCursor();
    bamWrite(spinnerChar);
    hideCursor();
    i += 1;
  }, 200);
};

const spinnerCleanup = () => {
  process.stdout.cursorTo(0);
  resetStyledText();
};

const bamAscii = fs.readFileSync('./ascii/bam.txt', 'utf8');

// catch ctrl+c event and exit normally
process.on('SIGINT', () => {
  resetStyledText();
  console.log('Ctrl-C...');
  process.exit(2);
});

// catch uncaught exceptions, trace, then exit normally
process.on('uncaughtException', (e) => {
  resetStyledText();
  console.log('Uncaught Exception...');
  console.log(e.stack);
  process.exit(99);
});

module.exports = {
  brightGreenSpinner,
  spinnerCleanup,
  bamText,
  bamAscii,
  bamLog,
  bamError,
  bamWarn,
};
