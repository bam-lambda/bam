const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const answers = [];

module.exports = async function getUserInput(prompts) {
  for (let i = 0; i < prompts.length; i += 1) {
    const [question, defaultAnswer] = prompts[i];
    const prompt = new Promise((resolve, reject) => {
      try {
        rl.question(question, resolve);
        rl.write(defaultAnswer);
      } catch (err) {
        reject(console.log(err, err.stack));
      }
    });

    const answer = await prompt;
    answers.push(answer);
  }

  rl.close();
  process.stdin.destroy();
  return answers;
};

/*
//ask user for their name, and then echo it to the console
rl.setPrompt("What is your name?");
rl.prompt(); //output the prompt

//when the user response, a 'line' event will trigger
rl.on('line', function(answer) {
    //echo the user's response to the console
    console.log(answer.trim())
});
rl.close();

//when the readline connection closes, a 'close' event will trigger
rl.on('close', function() {
    console.log("Bye!");
});
*/
