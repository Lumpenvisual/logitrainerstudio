const ACCESS_SALT = 'logitrainer-studio-gate-v1';

export async function hashAccessPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${ACCESS_SALT}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function matchesAccessPasswordHash(password: string, expectedHash: string): Promise<boolean> {
  if (!expectedHash) return false;
  const actual = await hashAccessPassword(password);
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
