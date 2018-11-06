#!/usr/bin/env node
const [,, ...args] = process.argv
const createLambda = require("./createLambda.js");
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');

if (args[0] === "init") {
  // creates bam directory within current directory
  const dir = './bam';
  const config = {};

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  // cd in to bam directory
  process.chdir(dir);

  // give prompts --> saves input to config object
  // - what is you AWS account id?
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question[promisify.custom] = (arg) => {
    return new Promise((resolve) => {
      rl.question(arg, resolve);
    });
  };

  const asyncQuestion = promisify(rl.question);

  const getUserDefaults = async () => {
    try {
      await asyncQuestion('Please provide your AWS account number: ', (answer) => {
        rl.close();
        config['acctId'] = answer;
      });
      await asyncQuestion('Please provide your default region: ', (answer) => {
        rl.close();
        config['region'] = answer // || getRegion() || 'us-east-1';
      });
      await asyncQuestion('Please provide your default role (if you do not provide one, one will be created for you): ', (answer) => {
        rl.close();
        config['role'] = answer || 'defaultBamRole';
      });


      const configStr = JSON.stringify(config);
      fs.writeFileSync('config.json', configStr);
      process.exit();
    } catch (err) {
      console.log(err, err.stack);
    }
  }

  getUserDefaults();
  // TODO: create policy template --> createPolicy, createRole --> add name of role to config
  // TODO: get region from config file on local machine --> add to config
} else if (args.slice(0,2).join(" ") === "create lambda") {
  createLambda(args[2]);
} else {

}
