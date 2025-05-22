export function appendPaths(paths: string[]): string {
  return paths.reduce(
    (prev, current) => `${prev.replace(/\/+$/, '')}/${current.replace(/^\/+/, '')}`,
  );
}
