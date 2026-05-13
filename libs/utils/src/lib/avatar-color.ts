/**
 * Deterministic avatar color + initials helpers.
 * Picks a stable background color from a fixed palette using a hash of the input name.
 * Same name always returns same color (across pagination, sessions, etc.).
 */

const AVATAR_PALETTE = [
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#D97706',
  '#16A34A',
  '#0891B2',
  '#DB2777',
  '#EA580C',
] as const;

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarColorForName(name: string): string {
  return AVATAR_PALETTE[nameHash(name) % AVATAR_PALETTE.length];
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}
