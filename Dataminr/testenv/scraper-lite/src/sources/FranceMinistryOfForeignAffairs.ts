import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    moment.locale('fr');
    const datePosted = moment($el.text().trim().split('|')[1].replace(/\t+/g, '').replace(/\n+/g, ''), 'LL');
    if (!datePosted.isSame(moment(), 'day')) return;
    threads.push({
      link: $el.attr('href'),
      parserName: 'post',
      title: $el.text().trim().split('|')[1].replace(/\t+/g, '').replace(/\n+/g, ''),
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    if (
      url.indexOf(
        'https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/dernieres-minutes?page_courante=1#pagination_dernieres_minutes',
      ) !== -1
    ) return;
    const $el = $(el);
    const country = $el.find('#fiche_pays_titre h1').text().trim();
    const description = $el.find('#derniere h3:nth-of-type(1)').text()
      + $el.find('#derniere h3:nth-of-type(1)').nextUntil('#derniere h3:nth-of-type(2)', 'p').text();
    posts.push(
      new Post({
        text: `Country: ${country}; Date: ${data[0]}; Description: ${description}`,
        postUrl: url,
        postedAt: moment(data[0], 'LL').unix(),
        extraData: {
          Country: country,
          Date: data[0],
          Description: description,
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'FranceMinistryOfForeignAffairs',
  'https://www.diplomatie.gouv.fr/',
  [
    {
      selector: ['#pagination_dernieres_minutes > div.bloc_dernieres_minutes > a'],
      parser: threadHandler,
    },
    {
      selector: ['div.base_element > section'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'fr/conseils-aux-voyageurs/dernieres-minutes?page_courante=1#pagination_dernieres_minutes',
);
