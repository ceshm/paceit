# PaceIt 🚶🎧

A deliberately minimal podcast player, built for **learning while walking**. PaceIt exists because every podcast app today is a discovery engine first and a player second. This is the opposite: a quiet triage screen and a player with ergonomics for language learners.

## The idea

Two motivations:

1. **Simplicity.** Google Podcasts had the perfect home screen — newest episodes from the shows you follow, nothing else. Nobody builds that anymore. PaceIt does.
2. **Language immersion.** The most effective way to acquire a language is massive listening to content you actually enjoy. PaceIt is an **audio player with learner ergonomics** — *not* a learning app. No streaks, no flashcards, no clutter. Just: slow the audio down, skip back 15 seconds, and stay in the flow.

## Features

- **Home** — newest episodes from followed shows, plus a "Continue" section for in-progress episodes
- **Search** — powered by the [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/); preview any show or follow it to subscribe to its RSS feed
- **Shows** — your followed shows with auto-detected language tags (日本語 / Français / …) from each feed's `<language>` element
- **Show & Episode details** — native per-tab navigation with full show/episode descriptions while keeping the tab bar and mini player accessible
- **Player** — floating mini player + full-screen Now Playing sheet with scrubber, ±15s skip, per-episode resume position, auto-advance within a show, background playback, and lock-screen controls
- **Learner controls** — speed cycling (`1 → 0.75 → 1.25 → 1.5 → 0.5 → 2`, pitch-corrected, persisted) and skip-back-15s, reachable from both the mini player and Now Playing

## Content sources

- Discovery: iTunes Search API (free, no key) — results include the show's RSS `feedUrl`
- Playback: standard podcast RSS feeds only. Shows that are Spotify-exclusive or don't publish RSS can't be added — accepted limitation, not a bug

## Architecture

```
src/
  app/
    _layout.tsx         Root providers (Library → Player), root Stack + MiniPlayer
    player.tsx          Full-screen Now Playing modal (formSheet)
    (tabs)/
      _layout.tsx       NativeTabs navigator
      home/             Home stack (index, show/[id], episode/[id])
      search/           Search stack (index, show/[id], episode/[id])
      following/        Shows stack (index, show/[id], episode/[id])
  components/
    screens/            Shared ShowDetails & EpisodeDetails screens
    app-tabs.tsx        NativeTabs config (SF + Material icons)
    mini-player.tsx     Floating persistent player bar
    scrubber.tsx        Touch-drag seek bar
    episode-row.tsx     Episode list item with play badge
    themed-*.tsx        Light/dark primitives
  hooks/                use-tab-prefix, use-theme, use-color-scheme
  lib/
    player.tsx          PlayerProvider — persistent expo-audio session, lock screen, rate, auto-advance
    library.tsx         LibraryProvider — followed shows, episodes, playback positions
    itunes.ts           iTunes Search API client
    rss.ts              RSS parsing (fast-xml-parser), HTML stripping, duration + language helpers
    storage.ts          AsyncStorage persistence (follows, episodes, positions, rate)
    types.ts            Show / Episode / PlaybackPosition
```

Providers wrap the whole app in `src/app/_layout.tsx`: `LibraryProvider → PlayerProvider → Stack + MiniPlayer`. Screens consume them via `useLibrary()` / `usePlayer()`.

## Development

```bash
npm install
npx expo start        # dev server (Expo Go works for UI + foreground audio)
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npx expo-doctor       # verify SDK dependencies and config
```

**Background playback requires a development build.** Expo Go can play audio in the foreground, but locking the screen stops it — the `audio` `UIBackgroundMode` (iOS) and media-playback foreground service (Android) only exist in a compiled binary:

```bash
npx expo run:ios --device                      # local build (needs Xcode)
# or
npx eas-cli@latest build --profile development # cloud build
```

## Status & roadmap

**Working:** search → follow → show/episode details → play/resume → full-screen Now Playing (scrubber, ±15s, speed cycling, auto-advance), language auto-tagging.

**Next:** dev-build validation of background audio + lock-screen controls, podcast UX polish (pull-to-refresh, mark played, queue), and language-learning ergonomics guided by real walking dogfooding.
