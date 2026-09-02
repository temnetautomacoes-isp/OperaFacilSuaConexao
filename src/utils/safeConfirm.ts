/**
 * Safe confirmation utility for running smoothly inside sandboxed iframes.
 * If window.confirm is blocked by the browser iframe policy, it fails gracefully.
 */
export function safeConfirm(message: string): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(message);
    }
  } catch (err) {
    console.warn('window.confirm blocked in iframe, allowing action:', err);
    return true;
  }
  return true;
}
