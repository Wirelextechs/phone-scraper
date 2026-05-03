// lib/session.ts — Anonymous session management
// Generates a UUID per browser/device, stored in localStorage.
// This persists across page reloads. Future: replace with auth user_id.

const SESSION_KEY = 'psp_session_id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Generate a simple UUID-like ID without importing uuid on client
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
