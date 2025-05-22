import { Task, Thread } from './types';

export const appendLink = (domain: string, link: string): string => {
  if (link.search(/^http:\/\/|^https:\/\//) === 0) return link;
  return `${domain.replace(/\/+$/, '')}/${link.replace(/^\/+/, '')}`;
};

export function getFullUrl(sourceUrl: string, threadUrl: string) {
  return appendLink(sourceUrl, threadUrl);
}

export const getHtmlTextBySelectors = (
  $: CheerioSelector,
  selectors: string[],
): CheerioElement[] => {
  for (const selector of selectors) {
    const elements: CheerioElement[] = $(selector).get();
    if (elements.length > 0) return elements;
  }
  return [];
};

export function getThreadArray(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  titleSelector: string,
  linkSelector: string,
): Thread[] {
  const threads: Thread[] = [];

  elements.forEach((element) => {
    const $el = $(element);
    const title = $el.find(titleSelector).text();
    const link = $el.find(linkSelector).attr('href');

    // eslint-disable-next-line no-restricted-globals
    if (title !== undefined && link !== undefined) {
      threads.push({ link, title });
    }
  });
  return threads;
}

export function toInitialTask(sourceUrl: string, entryUrl?: string): Task {
  return entryUrl === undefined
    ? { link: sourceUrl, data: [] }
    : { link: getFullUrl(sourceUrl, entryUrl), data: [] };
}
