const readline = require('readline');
const {
  setBrightGreenText,
  getStyledText,
  resetColor,
} = require('./fancyText.js');

const answers = [];

const asyncValidate = async (asyncCallback, validator, feedback, question, defaultAnswer) => {
  let colorfulResult;
  let result;

  while (true) {
    colorfulResult = await asyncCallback(question, defaultAnswer);
    [,, result] = colorfulResult.split('[1m');
    if (await validator(result)) break;
    setBrightGreenText();
    console.log(feedback);
  }

  return result;
};

module.exports = async function getUserInput(prompts) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // returns a pending prompt promise to handle single attempt at a question
  const pendingPrompt = (question, defaultAnswer) => (
    new Promise((resolve) => {
      resetColor();
      rl.question('', resolve);
      rl.write(getStyledText(question, 'green', 'bright'));
      rl.write(getStyledText(defaultAnswer, 'resetColor', 'bright'));
    })
  );

  for (let i = 0; i < prompts.length; i += 1) {
    const { question, validator, feedback, defaultAnswer } = prompts[i];
    const answer = await asyncValidate(pendingPrompt, validator, feedback, question, defaultAnswer);
    answers.push(answer);
  }

  rl.close();
  setBrightGreenText();
  return answers;
};
