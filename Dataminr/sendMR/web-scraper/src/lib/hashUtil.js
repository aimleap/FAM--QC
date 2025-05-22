import crypto from 'crypto';

export function toSha256(data) {
  if (typeof data !== 'object') throw new Error('data type must be an object');

  const ordered = {};
  Object.keys(data)
    .sort()
    .forEach((k) => {
      ordered[k] = data[k];
    });

  return crypto.createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}

export function getSourceHashId(url, type) {
  return toSha256({
    source_url: url,
    source_type: type,
  });
}

export function getThreadHashId(sourceHashId, threadUrl) {
  return toSha256({
    source_id: sourceHashId,
    thread_url: threadUrl,
  });
}

export function getPostHashId(sourceHashId, forumPaths, metadata) {
  if (!Array.isArray(forumPaths)) throw new Error('forumPaths must be an array type');
  if (typeof metadata !== 'object') throw new Error('metadata must be an object');

  return toSha256({
    source_id: sourceHashId,
    forum_paths: forumPaths,
    metadata,
  });
}

export const toMd5 = (text) => crypto.createHash('md5').update(text).digest('hex');

export const toSha1 = (text) => crypto.createHash('sha1').update(text).digest('hex');
