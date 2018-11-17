const readline = require('readline');
const { brightGreenText, brightGreenBackgroundText } = require('./fancyText.js');

const answers = [];

module.exports = async function getUserInput(prompts) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (let i = 0; i < prompts.length; i += 1) {
    const [question, defaultAnswer] = prompts[i];
    const prompt = new Promise((resolve, reject) => {
      try {
        rl.question(question, resolve);
        brightGreenBackgroundText();
        rl.write(defaultAnswer);
        // change hardcoded code
        process.stdout.write('\x1b[0m');
        brightGreenText();
      } catch (err) {
        reject(console.log(err, err.stack));
      }
    });

    const answer = await prompt;
    answers.push(answer);
  }

  rl.close();
  return answers;
};
