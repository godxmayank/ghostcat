/**
 * Username and avatar utilities
 * Manages localStorage-based user identity
 */

const USERNAME_KEY = 'ghostchat_username';
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6'
];

/**
 * Get or create username from localStorage
 */
export function getUsername(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem(USERNAME_KEY);
  if (stored) return stored;
  
  const generated = generateRandomUsername();
  localStorage.setItem(USERNAME_KEY, generated);
  return generated;
}

/**
 * Set new username in localStorage
 */
export function setUsername(name: string): void {
  if (typeof window === 'undefined') return;
  
  const trimmed = name.trim().slice(0, 30);
  if (trimmed) {
    localStorage.setItem(USERNAME_KEY, trimmed);
  }
}

/**
 * Generate random username (adjective + noun + number)
 */
function generateRandomUsername(): string {
  const adjectives = ['Swift', 'Bright', 'Calm', 'Eager', 'Keen', 'Happy', 'Quiet', 'Bold'];
  const nouns = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Raven', 'Owl', 'Hawk'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  
  return `${adj}${noun}${num}`;
}

/**
 * Generate avatar color based on username hash
 */
export function getAvatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Get user initials for avatar
 */
export function getInitials(username: string): string {
  return username
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}
