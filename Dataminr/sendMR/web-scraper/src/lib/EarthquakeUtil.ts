import Post from '../schema/post';

export function toPost(
  headline: string,
  location: string,
  depth: string,
  timestamp: number,
  magnitude: string,
  url: string,
): Post {
  return new Post(
    headline,
    {
      current_url: url,
    },
    timestamp,
    [],
    [],
    new Map(
      Object.entries({
        LOCATION: location,
        DEPTH: depth,
        MAGNITUDE: magnitude,
      }),
    ),
  );
}

export function toRows($: CheerioSelector, elements: CheerioElement[]): Cheerio[] {
  return elements.map((element: CheerioElement) => $(element).find('td'));
}
