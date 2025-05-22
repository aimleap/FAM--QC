import fs from 'fs/promises';
import path from 'path';

it('Testing unique names', async () => {
  const uniqueNames = new Set();
  const files = (await fs.readdir(path.join(__dirname, 'sources'))).filter(
    (f) => f.search(/\.js|ts$/) !== -1,
  );
  const modules = await Promise.all(files.map((f) => import(path.join(__dirname, 'sources', f))));

  modules.forEach((m, i) => {
    if (uniqueNames.has(m.parser.sourceName)) console.error(`duplicated name ${m.parser.sourceName} from ${files[i]}`);
    uniqueNames.add(m.parser.sourceName);
  });

  expect(uniqueNames.size).toEqual(modules.length);
});
