// TODO: user entered text is white
// TODO: reduce number of calls in cli.js
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

const changeTextStyle = (...codes) => {
  const styles = codes.reduce((codesStr, code) => `${codesStr}${ansi.codes[code]}`, '');
  process.stdout.write(styles);
};
const hideCursor = () => process.stdout.write(ansi.codes.hideCursor);
const showCursor = () => process.stdout.write(ansi.codes.showCursor);
const resetColor = () => process.stdout.write(ansi.codes.resetColor);

const reset = () => {
  resetColor();
  showCursor();
};

const brightGreenText = () => {
  changeTextStyle('bright', 'green');
};

const greenBackgroundWhiteText = () => {
  changeTextStyle('white', 'greenBg');
};

const brightGreenSpinner = () => {
  const cursors = ['|', '/', '-', '\\'];
  let i = 0;

  return setInterval(() => {
    i += 1;
    const cursor = cursors[i % 4];
    reset();
    process.stdout.cursorTo(0);
    changeTextStyle('bright', 'green');
    process.stdout.write(cursor);
    hideCursor();
  }, 200);
};

const spinnerCleanup = () => {
  process.stdout.cursorTo(0);
  reset();
  brightGreenText();
};

const brightGreenBamCharByChar = async () => {
  const bamStr = fs.readFileSync('./ascii/bam.txt', 'utf8');
  const exclaimBamStr = fs.readFileSync('./ascii/exclaimBam.txt', 'utf8');
  brightGreenText();

  for (let i = 0; i < bamStr.length; i += 1) {
    const char = bamStr[i];
    await new Promise((res) => {
      setTimeout(() => {
        res(process.stdout.write(char));
      }, 20);
    });
  }

  // moves cursor 6 lines up
  process.stdout.moveCursor(0, -6);
  brightGreenText();
  console.log(exclaimBamStr);
  reset();
};

// catch ctrl+c event and exit normally
process.on('SIGINT', () => {
  reset();
  console.log('Ctrl-C...');
  process.exit(2);
});

// catch uncaught exceptions, trace, then exit normally
process.on('uncaughtException', (e) => {
  reset();
  console.log('Uncaught Exception...');
  console.log(e.stack);
  process.exit(99);
});

module.exports = {
  brightGreenSpinner,
  spinnerCleanup,
  brightGreenText,
  brightGreenBamCharByChar,
  greenBackgroundWhiteText,
  resetColor,
};
