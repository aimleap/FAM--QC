import fs from 'fs';
import path from 'path';
import { inspect } from 'util';
import inquirer from 'inquirer';
import moment from 'moment';

const __dirname = path.resolve();

function getAllSources() {
  const dirPath = path.resolve(__dirname, 'src/sources/');
  console.info(dirPath);
  const files = fs.readdirSync(dirPath);
  const sources = files.map((fileName) => path.parse(fileName).name);
  return sources;
}

async function testSource(name) {
  const source = await import(`../dist/sources/${name}.js`);
  return source.parser.process();
}

(async () => {
  const allSources = getAllSources();
  const name =
    process.argv.length == 3
      ? process.argv[2]
      : await inquirer
          .prompt([
            {
              type: 'list',
              name: 'name',
              message: 'Please choose a source to test.',
              choices: allSources,
            },
          ])
          .then((answers) => answers.name);

  if (!allSources.includes(name)) {
    console.error('There is no source by that name.');
    process.exit(1);
  }

  testSource(name)
    .then((x) => {
      console.info(
        inspect(
          x.map((p) => ({
            ...p,
            postedAt: moment.unix(p.posted_at).format('MM/DD/YYYY hh:mm:ss A'),
          })),
          false,
          null,
          true,
        ),
      );
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
})();
