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

const showCursor = () => process.stdout.write(textStyles.showCursor);
const resetColor = () => process.stdout.write(textStyles.reset);

const resetStyledText = () => {
  showCursor();
  resetColor();
};

const getStyledText = (text, ...styles) => {
  const stylesStr = styles.reduce((result, style) => `${result}${textStyles[style]}`, '');
  return `${stylesStr}${text}${textStyles.reset}`;
};

module.exports = {
  getStyledText,
  resetStyledText,
};
