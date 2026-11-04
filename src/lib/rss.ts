import { XMLParser } from 'fast-xml-parser';

import type { Episode, Show } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // itunes:duration, itunes:author, etc.
  removeNSPrefix: true,
});

type FeedChannel = {
  title?: string | { '#text': string };
  language?: string;
  item?: FeedItem | FeedItem[];
};

type FeedItem = {
  guid?: string | { '#text': string };
  title?: string | { '#text': string };
  pubDate?: string;
  enclosure?: { '@_url'?: string; '@_type'?: string };
  'itunes:duration'?: string | number;
};

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && '#text' in (value as object)) {
    return String((value as { '#text': unknown })['#text'] ?? '');
  }
  return '';
}

/** "1:02:03" | "12:34" | "754" -> seconds */
export function parseDuration(raw: unknown): number {
  const text = asText(raw).trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, part) => acc * 60 + part, 0);
}

export function normalizeLanguage(raw: unknown): string {
  const text = asText(raw).trim().toLowerCase();
  if (!text) return '';
  // "ja-jp" -> "ja", "fr-FR" -> "fr"
  return text.split(/[-_]/)[0];
}

type FetchShowInput = Pick<Show, 'id' | 'title' | 'artwork'>;

/**
 * Fetch and parse a podcast RSS feed into episodes.
 * Also returns the feed's own language tag so we can tag shows on follow.
 */
export async function fetchEpisodes(
  feedUrl: string,
  show: FetchShowInput,
): Promise<{ episodes: Episode[]; language: string }> {
  const res = await fetch(feedUrl, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  if (!res.ok) {
    throw new Error(`Feed request failed (${res.status}): ${feedUrl}`);
  }
  const xml = await res.text();
  const doc = parser.parse(xml) as { rss?: { channel?: FeedChannel } };
  const channel = doc.rss?.channel;
  if (!channel) {
    throw new Error('Not a valid podcast RSS feed');
  }

  const items = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];
  const language = normalizeLanguage(channel.language);

  const episodes: Episode[] = items
    .map((item, index) => {
      const audioUrl = item.enclosure?.['@_url'] ?? '';
      const title = asText(item.title).trim();
      const guid = asText(item.guid).trim() || audioUrl || `${show.id}-${index}`;
      const pubDateMs = item.pubDate ? Date.parse(item.pubDate) : NaN;
      return {
        id: guid,
        showId: show.id,
        showTitle: show.title,
        showArtwork: show.artwork,
        title,
        pubDate: Number.isNaN(pubDateMs) ? 0 : pubDateMs,
        audioUrl,
        durationSec: parseDuration(item['itunes:duration']),
      };
    })
    .filter((ep) => ep.audioUrl && ep.title);

  return { episodes, language };
}