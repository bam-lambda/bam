const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

module.exports = async function asyncQuestion(prompt, defaultValue) {
  const question = new Promise((resolve, reject) => {
    rl.question(prompt, resolve);
    rl.write(defaultValue);
  });
  const answer = await question;
  rl.close();
  return answer;
};
