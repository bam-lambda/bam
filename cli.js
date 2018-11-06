#!/usr/bin/env node
const [,, ...args] = process.argv
const createLambda = require("./createLambda.js");
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const { homedir } = require('os');
const config = {};

const getRegion = () => {
  const configStr = fs.readFileSync(homedir() + '/.aws/config', 'utf8');
  const defaultProfile = configStr.split('[').find(el => el.match('default'));
  const regionLine = defaultProfile.split('\n').find(el => el.match('region'));
  const region = regionLine.split('= ')[1];
  config.region = region;
};

getRegion();

 if (args[0] === "init") {
  // creates bam directory within current directory
  const dir = './bam';

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

  // overwrites return value of promisify
  rl.question[promisify.custom] = (prompt, defaultValue) => (
    new Promise((resolve) => {
      rl.question(prompt, resolve);
      rl.write(defaultValue);
    })
  );

  const asyncQuestion = promisify(rl.question);

  const getUserDefaults = async () => {
    try {
      config.accountNumber = await asyncQuestion('Please provide your AWS account number: ', '');
      config.region = await asyncQuestion('Please provide your default region: ', config.region);
      config.role = await asyncQuestion('Please provide your default role (if you do not provide one, one will be created for you): ', 'bamDefaultRole');
    } catch (err) {
      console.log(err, err.stack);
    }
  };

  const seeConfig = async () => {
    await getUserDefaults();
    const configStr = JSON.stringify(config);
    fs.writeFileSync('config.json', configStr);
    process.exit();
  };

  seeConfig();
  // TODO: create policy template --> createPolicy, createRole --> add name of role to config
} else if (args.slice(0,2).join(" ") === "create lambda") {
  createLambda(args[2]);
} else {

}
