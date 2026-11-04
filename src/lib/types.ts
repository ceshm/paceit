export type Show = {
  /** iTunes collectionId, used as stable id */
  id: string;
  title: string;
  artist: string;
  feedUrl: string;
  artwork: string;
  /** ISO language prefix from the feed, e.g. 'ja', 'fr', 'en' — editable later */
  language: string;
  /** plain-text show description from the feed, when available */
  description?: string;
  addedAt: number;
};

export type Episode = {
  /** guid from the feed (or enclosure url as fallback) */
  id: string;
  showId: string;
  showTitle: string;
  showArtwork: string;
  title: string;
  /** unix ms */
  pubDate: number;
  audioUrl: string;
  /** seconds, 0 if unknown */
  durationSec: number;
  /** plain-text episode description / show notes, '' when the feed has none */
  description: string;
};

export type PlaybackPosition = {
  episodeId: string;
  /** seconds */
  position: number;
  duration: number;
  updatedAt: number;
};

/** Languages relevant to the user's learning goals, used for filter chips */
export const LANGUAGES = ['ja', 'fr', 'en', 'es'] as const;