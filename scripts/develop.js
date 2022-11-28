'use strict';

const { Command } = require('commander');
const inquirer = require('inquirer');
const execa = require('execa');

const program = new Command();

const questions = [
  {
    type: 'list',
    name: 'useCase',
    message: 'Which Strapi app do you want to run?',
    choices: [
      {
        name: 'Get Started',
        value: './examples/getstarted',
      },
      {
        name: 'Kitchen Sink',
        value: './examples/kitchensink',
      },
      {
        name: 'Another existing app',
        value: 'existing',
      },
      {
        name: 'A new temporary app',
        value: 'new',
      },
    ],
  },
  {
    type: 'input',
    name: 'existingAppPath',
    message: 'What is the path to your Strapi app?',
    when: (answers) => answers.useCase === 'existing',
  },
  {
    type: 'list',
    name: 'existingAppPath',
    message: 'Do you want to use a template?',
    when: (answers) => answers.useCase === 'new',
    choices: [
      {
        name: 'No, create an empty app',
        value: null,
      },
      {
        name: 'Yes, I want a blog',
        value: 'blog',
      },
      {
        name: 'Yes, I want a corporate site',
        value: 'corporate',
      },
    ],
  },
];

program
  .command('develop')
  .description('Start Strapi in watch mode')
  .action(runDevelop)
  .parse(process.argv);

function getAppPath(answers) {
  if (answers.useCase === 'new') {
    // TODO: create a new app
    throw new Error('Not implemented yet');
    // Either use the create-strapi-app package via execa
    // Or call @strapi/generate-new with some hardcoded options
    // Maybe just let users pick a template?
  }
  if (answers.useCase === 'existing') {
    return answers.existingAppPath;
  }
  return answers.useCase;
}

async function runDevelop() {
  // Find info about the app to run
  const answers = await inquirer.prompt(questions);
  const appPath = getAppPath(answers);

  // Run the app
  // TODO: find why build not updating
  execa('yarn', ['develop'], {
    stdio: 'inherit',
    cwd: appPath,
  });
  // TODO: handle process exit to delete the app if it was temporary
}
