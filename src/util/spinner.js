const exitHandler = () => {
  process.stdout.clearLine();
  process.stdout.write('\u001b[?25h');
  process.stdout.write('\033[0m');
  console.log();
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

const displaySpinnerChar = async (char) => {
  await new Promise((res, rej) => {
    try {
      setTimeout(() => {
        process.stdout.write('\u001b[?25h');
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`\x1b[32m\x1b[1m${char}`);
        process.stdout.write('\u001b[?25l');
        res();
      }, 200);
    } catch (err) {
      console.log(err);
      rej();
    }
  });
};

const spinningCursor = async () => {
  const cursors = ['|', '/', '-', '\\'];
  for (let i = 0; i < 10; i += 1) {
    const cursor = cursors[i % 4];
    await displaySpinnerChar(cursor);
  }
};

module.exports = async function displaySpinningCursor() {
  await spinningCursor(); 
  process.stdout.clearLine();
  console.log();
};
