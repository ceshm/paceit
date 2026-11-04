import { useMemo, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LayoutAnimation, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type ScrubberProps = {
  /** current position in seconds */
  value: number;
  /** total duration in seconds (0 = unknown) */
  max: number;
  /** called when the user releases the handle */
  onSeek: (seconds: number) => void;
};

/**
 * Custom scrub bar (no native slider dependency): tap or drag to seek.
 * While dragging, shows a local preview so the live position doesn't fight it.
 *
 * `.runOnJS(true)` forces every gesture callback onto the JS thread — no
 * Reanimated worklets. That's deliberate: this scrubber only updates React
 * state, and with UI-thread worklets any captured plain-JS helper (e.g. a
 * `clamp` util) or state setter becomes a "remote function" whose synchronous
 * call aborts the app with no redbox. See
 * https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting
 */
export function Scrubber({ value, max, onSeek }: ScrubberProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [previewRatio, setPreviewRatio] = useState<number | null>(null);

  const ratio = previewRatio ?? (max > 0 ? Math.min(1, value / max) : 0);

  // `previewRatio` doubles as the "user is dragging" flag
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(1)
        .onBegin((e) => {
          if (max <= 0 || trackWidth <= 0) return;
          setPreviewRatio(clamp(e.x / trackWidth));
        })
        .onUpdate((e) => {
          if (max <= 0 || trackWidth <= 0) return;
          setPreviewRatio(clamp(e.x / trackWidth));
        })
        .onFinalize((e) => {
          if (max <= 0 || trackWidth <= 0) return;
          const target = clamp(e.x / trackWidth) * max;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setPreviewRatio(null);
          onSeek(target);
        }),
    [max, trackWidth, onSeek],
  );

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={pan}>
        <View
          style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          hitSlop={{ top: 20, bottom: 20 }}
        >
          <View
            style={[
              styles.fill,
              { backgroundColor: theme.text, width: `${ratio * 100}%` },
            ]}
          />
          <View
            style={[
              styles.knob,
              { backgroundColor: theme.text, left: `${ratio * 100}%` },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n));
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  knob: {
    position: 'absolute',
    top: -6,
    width: 17,
    height: 17,
    borderRadius: 9,
    marginLeft: -8,
  },
});
