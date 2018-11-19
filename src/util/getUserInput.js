const readline = require('readline');
const {
  setBrightGreenText,
  getStyledText,
  resetColor,
} = require('./fancyText.js');

const answers = [];

module.exports = async function getUserInput(prompts) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (let i = 0; i < prompts.length; i += 1) {
    const [question, defaultAnswer] = prompts[i];
    const colorfulQuestion = getStyledText(question, 'green', 'bright');
    const prompt = new Promise((resolve, reject) => {
      try {
        resetColor();
        rl.question('', resolve);
        rl.write(colorfulQuestion);
        rl.write(getStyledText(defaultAnswer, 'white', 'bright'));
      } catch (err) {
        reject(console.log(err, err.stack));
      }
    });

    const colorfulAnswer = await prompt;
    const answer = colorfulAnswer.split('[1m')[2];
    setBrightGreenText();
    answers.push(answer);
  }

  rl.close();
  return answers;
};
