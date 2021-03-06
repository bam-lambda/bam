const { log } = console;
const { stdout } = process;

const {
  getStyledText,
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
const captitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`;

const msgAfterAction = (resourceType, resourceName, action, modification = 'has been') => {
  let msg = action === 'created' ? '💥  ' : '';
  msg += `${captitalize(resourceType)}: "${resourceName}" ${modification} ${action}`;
  return msg;
};

const hideCursorAndWriteBamText = (text) => {
  const bamifiedText = bamText(text);
  stdout.write(`${resetCursor}${bamifiedText}${hideCursor}`);
};

module.exports = {
  log,
  logInColor,
  getStyledText,
  bamWrite,
  bamLog,
  msgAfterAction,
  bamWarn,
  bamText,
  bamError,
  hideCursorAndWriteBamText,
  resetCursorPosition,
  indent,
  indentFurther,
  indentFurthest,
  vertPadding,
};
