/**
 * Random id for one browser visit (tab session), shared by the AI assistant
 * and the search log. Groups one visitor's questions and searches without
 * identifying anyone. Client-side only.
 */
const KEY = 'dm-visit-session';

export function getVisitSessionId(): string | null {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode, sandboxed frame): log without a session.
    return null;
  }
}
