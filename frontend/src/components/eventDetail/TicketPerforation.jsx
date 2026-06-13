import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Semicircle radius — center sits on the card's left/right edge. */
export const TICKET_NOTCH_RADIUS = 14;
const NOTCH_HEIGHT = TICKET_NOTCH_RADIUS * 2;
/** Slightly larger draw radius so card edge/border lines don't peek through. */
const NOTCH_DRAW_RADIUS = TICKET_NOTCH_RADIUS + 1.5;

/**
 * Edge-aligned semicircular cut-outs. Overlays the card edge — no dashed line.
 */
export default function TicketPerforation({ cutoutColor = '#F1F5F9', style }) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0) setWidth(next);
  }, []);

  return (
    <View style={[styles.row, style]} onLayout={onLayout} pointerEvents="none">
      {width > 0 ? (
        <Svg width={width} height={NOTCH_HEIGHT} style={StyleSheet.absoluteFill}>
          <Circle
            cx={0}
            cy={TICKET_NOTCH_RADIUS}
            r={NOTCH_DRAW_RADIUS}
            fill={cutoutColor}
          />
          <Circle
            cx={width}
            cy={TICKET_NOTCH_RADIUS}
            r={NOTCH_DRAW_RADIUS}
            fill={cutoutColor}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: NOTCH_HEIGHT,
    zIndex: 6,
    overflow: 'visible',
  },
});
