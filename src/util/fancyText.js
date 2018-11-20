/* eslint no-console: 0 */
const fs = require('fs');

const bamTextStyles = ['green', 'bright'];

const escapeChar = '\x1b';
const textStyles = {
  showCursor: `${escapeChar}[?25h`,
  hideCursor: `${escapeChar}[?25l`,
  reset: `${escapeChar}[0m`,
  bright: `${escapeChar}[1m`,
  green: `${escapeChar}[32m`,
  yellow: `${escapeChar}[33m`,
  red: `${escapeChar}[31m`,
};

const hideCursor = () => process.stdout.write(textStyles.hideCursor);
const showCursor = () => process.stdout.write(textStyles.showCursor);
const resetColor = () => process.stdout.write(textStyles.reset);

const resetStyledText = () => {
  resetColor();
  showCursor();
};

const getStyledText = (text, ...styles) => {
  const stylesStr = styles.reduce((result, style) => `${result}${textStyles[style]}`, '');
  return `${stylesStr}${text}${textStyles.reset}`;
};

const bamText = text => getStyledText(text, ...bamTextStyles);
const bamWarnText = text => getStyledText(text, 'yellow');
const bamErrorText = text => getStyledText(text, 'red');

const bamWrite = text => process.stdout.write(bamText(text));
const bamLog = text => console.log(bamText(text));
const bamWarn = text => console.log(bamWarnText(text));
const bamError = text => console.log(bamErrorText(text));

const bamSpinner = () => {
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
  process.stdout.clearLine();
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
  bamSpinner,
  spinnerCleanup,
  bamText,
  bamAscii,
  bamLog,
  bamError,
  bamWarn,
};
