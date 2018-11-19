const fs = require('fs');

class Ansi {
  constructor() {
    const escapeChar = '\u001B';
    this.codes = {
      showCursor: `${escapeChar}[?25h`,
      resetColor: `${escapeChar}[0m`,
      bright: `${escapeChar}[1m`,
      green: `${escapeChar}[32m`,
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

const getStyledText = (text, ...codes) => (
  codes.reduce((codesStr, code) => `${codesStr}${ansi.codes[code]}`, '') + text
);

const changeTextStyle = (...codes) => {
  process.stdout.write(getStyledText('', ...codes));
};

const setBrightGreenText = () => {
  changeTextStyle('bright', 'green');
};

const brightGreenSpinner = () => {
  const cursors = ['|', '/', '-', '\\'];
  let i = 0;

  return setInterval(() => {
    i += 1;
    const cursor = cursors[i % 4];
    resetStyledText();
    process.stdout.cursorTo(0);
    setBrightGreenText();
    process.stdout.write(cursor);
    hideCursor();
  }, 200);
};

const spinnerCleanup = () => {
  process.stdout.cursorTo(0);
  resetStyledText();
  setBrightGreenText();
};

const brightGreenBamCharByChar = async () => {
  const bamStr = fs.readFileSync('./ascii/bam.txt', 'utf8');
  setBrightGreenText();
  console.log(bamStr);
};

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
  getStyledText,
  setBrightGreenText,
  brightGreenBamCharByChar,
  resetColor,
  resetStyledText,
};
