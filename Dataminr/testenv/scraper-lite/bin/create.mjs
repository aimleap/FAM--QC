import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const __dirname = path.resolve();

function checkExistingSource(name) {
  const dirPath = path.resolve(__dirname, 'src/sources/');
  const files = fs.readdirSync(dirPath);
  return files.includes(`${name}.ts`);
}

inquirer
  .prompt([
    {
      type: 'list',
      name: 'parser_type',
      message: 'What kind of parser template do you need?',
      choices: ['LiteParser', 'PuppeteerParser'],
    },
    {
      type: 'input',
      name: 'parser_name',
      message: 'Please enter new source name:',
    },
  ])
  .then((answers) => {
    if (checkExistingSource(answers.parser_name)) {
      console.error('A source by that name already exists.');
      process.exit(1);
    }

    const srcPath = path.resolve(__dirname, `templates/${answers.parser_type}.ts`);
    const destPath = path.resolve(__dirname, `src/sources/${answers.parser_name}.ts`);
    fs.copyFile(srcPath, destPath, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`${answers.parser_name} source created!`);
    });
  });
