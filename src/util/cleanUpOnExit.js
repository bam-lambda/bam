const { log, bamSpinner, bamError } = require('./logger');

module.exports = (() => {
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
    process.exit(99);
  });
})();
