import { useEffect, useMemo, useRef, useState } from 'react';
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
 */
export function Scrubber({ value, max, onSeek }: ScrubberProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [previewRatio, setPreviewRatio] = useState<number | null>(null);

  // Mirror for gesture callbacks without recreating the gesture every frame
  const previewRatioRef = useRef<number | null>(null);
  useEffect(() => {
    previewRatioRef.current = previewRatio;
  }, [previewRatio]);

  const ratio = previewRatio ?? (max > 0 ? Math.min(1, value / max) : 0);

  // `previewRatio` doubles as the "user is dragging" flag
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(1)
        .onBegin((e) => {
          if (max <= 0 || trackWidth <= 0) return;
          setPreviewRatio(clamp(e.x / trackWidth));
        })
        .onUpdate((e) => {
          if (previewRatioRef.current === null) return;
          setPreviewRatio(clamp(e.x / trackWidth));
        })
        .onFinalize((e) => {
          if (previewRatioRef.current === null) return;
          const target = clamp(e.x / trackWidth) * max;
          setPreviewRatio(null);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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