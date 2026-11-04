const SEARCH_URL = 'https://itunes.apple.com/search';

export type ItunesResult = {
  id: string;
  title: string;
  artist: string;
  feedUrl: string;
  artwork: string;
  /** Apple storefront country, e.g. 'US', 'JP' — weak language signal */
  country: string;
  genres: string[];
};

type ItunesApiResponse = {
  resultCount: number;
  results: {
    collectionId?: number;
    collectionName?: string;
    artistName?: string;
    feedUrl?: string;
    artworkUrl600?: string;
    artworkUrl100?: string;
    country?: string;
    genres?: string[];
  }[];
};

export async function searchPodcasts(term: string, limit = 25): Promise<ItunesResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const url = `${SEARCH_URL}?media=podcast&limit=${limit}&term=${encodeURIComponent(trimmed)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`iTunes search failed: ${res.status}`);
  }
  const data = (await res.json()) as ItunesApiResponse;

  return data.results
    .filter((r) => r.collectionId && r.feedUrl)
    .map((r) => ({
      id: String(r.collectionId),
      title: r.collectionName ?? 'Unknown show',
      artist: r.artistName ?? 'Unknown artist',
      feedUrl: r.feedUrl!,
      artwork: r.artworkUrl600 ?? r.artworkUrl100 ?? '',
      country: r.country ?? '',
      genres: r.genres ?? [],
    }));
}