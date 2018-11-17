// TODO: add better event listeners
// TODO: cleanup:
//   where should brightGreenText go?
//   clearing?
// TODO: highlight default inputs

const fs = require('fs');

const ansiCodes = {
  clearBuffer: '\u001b[?25h',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  white: '\x1b[37m',
  greenBg: '\x1b[42m',
  hideCursor: '\u001b[?25l',
};

const reset = () => {
  process.stdout.clearLine();
  process.stdout.write(ansiCodes.reset);
  // console.log();
};

const exitHandler = () => {
  process.stdout.write(ansiCodes.clearBuffer);
  reset();
  process.exit();
};

// do something when app is closing
process.on('exit', exitHandler.bind(null));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null));
process.on('SIGUSR2', exitHandler.bind(null));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null));

const brightGreenText = () => {
  process.stdout.write(`${ansiCodes.green}${ansiCodes.bright}`);
};

const brightGreenBackgroundText = () => {
  process.stdout.write(`${ansiCodes.white}${ansiCodes.greenBg}`);
};

const displayGreenChar = async (char) => {
  await new Promise((res, rej) => {
    try {
      setTimeout(() => {
        reset();
        process.stdout.cursorTo(0);
        brightGreenText();
        process.stdout.write(char);
        process.stdout.write(ansiCodes.hideCursor);
        res();
      }, 200);
    } catch (err) {
      console.log(err);
      rej();
    }
  });
};

const greenSpinningCursor = async () => {
  const cursors = ['|', '/', '-', '\\'];
  for (let i = 0; i < 10; i += 1) {
    const cursor = cursors[i % 4];
    await displayGreenChar(cursor);
  }
};

const greenBamCharByChar = async () => {
  const bamStr = fs.readFileSync('./bam.txt', 'utf8');
  const exclaimBamStr = fs.readFileSync('./exclaimBam.txt', 'utf8');
  brightGreenText();
  for (let i = 0; i < bamStr.length; i += 1) {
    const char = bamStr[i];
    await new Promise((res) => {
      setTimeout(() => {
        res(process.stdout.write(char));
      }, 20);
    });
  }

  // makes cursor jump 6 lines up
  process.stdout.moveCursor(0, -6);
  brightGreenText();
  console.log(exclaimBamStr);
};

const displayGreenSpinningCursor = async () => {
  await greenSpinningCursor();
  reset();
};

module.exports = {
  displayGreenSpinningCursor,
  brightGreenText,
  greenBamCharByChar,
  brightGreenBackgroundText,
};
