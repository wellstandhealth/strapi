'use strict';

const { Command } = require('commander');
const inquirer = require('inquirer');
const execa = require('execa');
const crypto = require('crypto');
const fse = require('fs-extra');
const os = require('os');
const { join } = require('path');
const { generateNewApp } = require('@strapi/generate-new');

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
  {
    type: 'list',
    name: 'watchAdmin',
    message: 'Will you be working on the admin UI?',
    choices: [
      {
        name: 'Yes',
        value: true,
      },
      {
        name: 'No',
        value: false,
      },
    ],
  },
];

program
  .command('develop')
  .description('Start Strapi in watch mode')
  .action(runDevelop)
  .parse(process.argv);

async function createTemporaryApp(answers) {
  const tmpAppPath = join(os.tmpdir(), `strapi-${crypto.randomBytes(6).toString('hex')}`);
  await generateNewApp(tmpAppPath, {
    quickstart: true,
    ...(answers.template && { template: answers.template }),
  });
  return tmpAppPath;
}

async function getExistingAppPath(answers) {
  if (answers.useCase === 'new') {
    return createTemporaryApp(answers);
  }
  if (answers.useCase === 'existing') {
    return answers.existingAppPath;
  }
  return answers.useCase;
}

// Run the app
async function runExistingApp(appPath, answers) {
  const sigintHandler = () => {
    console.log('SIGINT received, exiting Strapi...');
  };

  process.on('SIGINT', sigintHandler);

  await execa('yarn', ['develop', ...(answers.watchAdmin ? ['--watch-admin'] : [])], {
    cwd: appPath,
    stdio: 'inherit',
  }).on('exit', () => console.log('Strapi exited'));

  process.removeListener('SIGINT', sigintHandler);
}

async function runDevelop() {
  // Get required information about the app to run
  const answers = await inquirer.prompt(questions);
  const appPath = await getExistingAppPath(answers);

  // Run the app
  try {
    await runExistingApp(appPath, answers);
  } catch (error) {
    // Silently exit if the user cancels the command;
  }

  // Delete the app if it was temporary
  console.log('Cleaning up...', answers.useCase);
  if (answers.useCase === 'new') {
    console.info(`Deleting temporary app at ${appPath}`);
    fse.rm(appPath, { recursive: true, force: true });
  }
}
