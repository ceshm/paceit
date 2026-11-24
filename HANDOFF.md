# PaceIt — session handoff

> Read [AGENTS.md](./AGENTS.md) (architecture, rules, permanent gotchas) and [README.md](./README.md) (product context) first.

## Guiding approach right now

**Polish the podcast-listening UX first. Discover the language-learning features later by dogfooding.**

Make PaceIt feel complete *as a podcast player* so it can be taken on real walks, then let actual usage dictate which learning features to build (language filter chips, etc. are deliberately deferred — do not build them proactively). When suggesting work, prioritize whatever makes daily walking-listening feel polished.

## Current state

All work on `main`:

- **Core player & library**: iTunes Search API discovery → follow shows via RSS → Home feed (newest episodes + "Continue" in-progress section) → persistent playback with per-episode resume positions, persisted speed cycling (`1 → 0.75 → 1.25 → 1.5 → 0.5 → 2`), ±15s skip, and auto-advance to the next episode of the same show.
- **Now Playing modal** (`src/app/player.tsx`): native `formSheet` on both platforms (iOS card, Android Material `BottomSheetBehavior` with native swipe-to-dismiss + scrim), custom `Scrubber`, bottom safe-area clearance, `MiniPlayer` hidden while open.
- **Navigation & detail screens** (`bc1f5b7`): per-tab `Stack` navigators nested inside `NativeTabs` (`src/app/(tabs)/{home,search,following}/`) so pushing Show/Episode detail screens keeps the native tab bar visible with native headers and back buttons. Shared implementations live in `src/components/screens/{show-details,episode-details}.tsx` using `useTabPrefix()`. RSS item + channel descriptions are stripped of HTML and persisted.
- **Project hygiene**: removed unused Expo starter template files (including broken `.web` files and `scripts/reset-project.js`), fixed missing `android.adaptiveIcon` paths in `app.json`, installed missing `expo-audio` peer dep `expo-asset`, aligned SDK 58 package versions, added `npm run typecheck`, and synced docs. `npm run typecheck`, `npm run lint`, and `npx expo-doctor` all pass cleanly.

## Next steps, in order

1. **Device-verify navigation in Expo Go (iOS + Android)**: confirm tab bar stays visible on detail screens, native headers + back buttons behave properly, `MiniPlayer` clearance looks right, and per-tab stack state persists across tab switches. Watch for iOS 18-and-earlier transparent tab bar on scroll edge (`disableTransparentOnScrollEdge` if it looks off).
2. **Development build (`npx expo run:ios --device` or `npx eas-cli@latest build --profile development`)**: validate background playback and lock-screen controls (core walking use case — Expo Go stops audio when the screen locks). Before signing/EAS builds, replace placeholder `ios.bundleIdentifier` (`com.anonymous.paceit`) and add `android.package` in `app.json` (plus `eas.json` if using EAS).
3. **Podcast UX polish candidates**: queue management, episode "mark played", pull-to-refresh on Home, richer episode rows (description snippet).
4. **Learning/language features**: **wait for dogfooding feedback**.

## Active caveats

- Episodes cached *before* `description` was added to `Episode` won't show descriptions until the next feed refresh (app restart triggers it).
- `ios.bundleIdentifier` in `app.json` is still placeholder `com.anonymous.paceit` — update before real device signing or EAS builds.
- `android.adaptiveIcon` currently reuses `./assets/images/icon.png` as `foregroundImage` — replace with dedicated adaptive foreground/monochrome art before release.
- Keep this file updated at the end of each session; promote permanent engineering gotchas to `AGENTS.md` and prune superseded notes.
