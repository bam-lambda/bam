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

const { reset, showCursor, hideCursor } = textStyles;

const warningColor = 'yellow';
const errorColor = 'red';
const bamTextStyles = ['green', 'bright'];

const resetCursor = `${showCursor}${reset}`;
const writeResetCursor = () => process.stdout.write(resetCursor);

const resetStyledText = () => {
  writeResetCursor();
};

const getStyledText = (text, ...styles) => {
  const stylesStr = styles.reduce(
    (result, style) => `${result}${textStyles[style]}`,
    '',
  );
  return `${stylesStr}${text}${textStyles.reset}`;
};

module.exports = {
  getStyledText,
  resetStyledText,
  warningColor,
  errorColor,
  bamTextStyles,
  hideCursor,
  resetCursor,
};
