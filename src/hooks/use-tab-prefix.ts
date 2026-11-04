import { useSegments } from 'expo-router';

/** The tab directories under (tabs) — keep in sync with the file structure. */
export type TabPrefix = '/home' | '/search' | '/following';

/**
 * Route prefix for the tab the current screen belongs to (e.g. "/home").
 *
 * Detail routes (show/episode details) exist inside every tab's stack, so
 * shared components push within the current tab using this prefix. Segments
 * look like ['(tabs)', 'home', ...] — groups are wrapped in parens, so the
 * first non-group segment is the tab directory. The cast is safe because the
 * set of tabs is closed (see TabPrefix) and defined by our own file layout.
 */
export function useTabPrefix(): TabPrefix {
  const segments = useSegments();
  const tab = segments.find((segment) => !segment.startsWith('(')) ?? 'home';
  return `/${tab}` as TabPrefix;
}
