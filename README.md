# PaceIt 🚶🎧

A deliberately minimal podcast player, built for **learning while walking**. PaceIt exists because every podcast app today is a discovery engine first and a player second. This is the opposite: a quiet triage screen and a player with ergonomics for language learners.

## The idea

Two motivations:

1. **Simplicity.** Google Podcasts had the perfect home screen — newest episodes from the shows you follow, nothing else. Nobody builds that anymore. PaceIt does.
2. **Language immersion.** The most effective way to acquire a language (the way English was acquired) is massive listening to content you actually enjoy. PaceIt is an **audio player with learner ergonomics** — *not* a learning app. No streaks, no flashcards, no clutter. Just: slow the audio down, skip back 15 seconds, and stay in the flow.

## Features

- **Home** — newest episodes from followed shows, plus a "Continue" section for in-progress episodes
- **Search** — powered by the [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/); follow a show and its RSS feed is stored
- **Shows** — your followed shows with auto-detected language tags (日本語 / Français / …) from each feed's `<language>` element
- **Player** — background playback, lock-screen controls, per-episode resume position
- **Learner controls** — speed cycling (1 → 0.75 → 1.25 → 1.5 → 0.5 → 2, pitch-corrected) and skip-back-15s, both reachable from the floating mini player

## Content sources

- Discovery: iTunes Search API (free, no key) — results include the show's RSS `feedUrl`
- Playback: standard podcast RSS feeds only. Shows that are Spotify-exclusive or don't publish RSS can't be added — accepted limitation, not a bug

## Architecture

```
src/
  app/            Expo Router screens: index (Home), search, following
  lib/
    player.tsx    PlayerProvider — one persistent audio session for the app's
                  lifetime (expo-audio), lock screen metadata, rate control
    library.tsx   LibraryProvider — followed shows, episodes, playback positions
    itunes.ts     iTunes Search API client
    rss.ts        RSS parsing (fast-xml-parser), duration + language helpers
    storage.ts    AsyncStorage persistence (follows, episodes, positions, rate)
    types.ts      Show / Episode / PlaybackPosition
  components/     mini-player, episode-row, themed primitives, NativeTabs config
```

Providers wrap the whole app in `src/app/_layout.tsx`: `LibraryProvider → PlayerProvider → tabs + MiniPlayer`. Screens consume them via `useLibrary()` / `usePlayer()`.

## Development

```bash
npm install
npx expo start        # dev server (Expo Go works for UI + foreground audio)
npx tsc --noEmit      # typecheck
npx eslint src        # lint
```

**Background playback requires a development build.** Expo Go can play audio in the foreground, but locking the screen stops it — the `audio` `UIBackgroundMode` (iOS) and media-playback foreground service (Android) only exist in a compiled binary:

```bash
npx expo run:ios --device            # local build (needs Xcode)
# or
npx eas-cli build --profile development   # cloud build
```

## Status & roadmap

**Working:** search → follow → play → resume, learner controls, language auto-tagging.

**Next:** full-screen Now Playing (scrub bar), auto-advance within a show, language filter chips on Home, dev-build validation of background audio + lock-screen controls.