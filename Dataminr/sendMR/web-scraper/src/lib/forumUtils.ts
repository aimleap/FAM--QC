import crypto from 'crypto';

export function formatText(
  isFirstPost: boolean,
  threadTitle: string,
  postText: string,
  userName: string,
): string {
  if (isFirstPost) return `${userName}: ${threadTitle}, ${postText}`;
  return `${userName}: ${postText}`;
}

export function generateThreadId(threadName: string): string {
  return crypto.createHash('md5').update(threadName).digest('hex');
}
