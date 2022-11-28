'use strict';

const { Command } = require('commander');
const inquirer = require('inquirer');
const execa = require('execa');

const program = new Command();

const questions = [
  {
    type: 'list',
    name: 'useCase',
    message: 'What do you want to do?',
    choices: [
      {
        name: 'Point to an existing Strapi app',
        value: 'point',
      },
      {
        name: 'Create a new Strapi app',
        value: 'create',
      },
    ],
  },
  {
    type: 'input',
    name: 'directory',
    message: 'What is the path to your Strapi app?',
    when: (answers) => answers.useCase === 'point',
  },
];

program
  .command('develop')
  .description('Start Strapi in watch mode')
  .action(runDevelop)
  .parse(process.argv);

function runApp(path) {
  return execa('yarn', ['develop'], {
    stdio: 'inherit',
    cwd: path,
  });
}

async function runDevelop() {
  const answers = await inquirer.prompt(questions);
  console.log(answers);
  runApp(answers.directory);
}
