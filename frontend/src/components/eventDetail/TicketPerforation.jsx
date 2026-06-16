import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

/** Semicircle radius — center sits on the card's left/right edge. */
export const TICKET_NOTCH_RADIUS = 16;
const NOTCH_HEIGHT = TICKET_NOTCH_RADIUS * 2;
/** Slightly larger draw radius so card edge/border lines don't peek through. */
const NOTCH_DRAW_RADIUS = TICKET_NOTCH_RADIUS + 2;

/**
 * Edge-aligned semicircular cut-outs with dashed tear line (reference ticket style).
 */
export default function TicketPerforation({
  cutoutColor = '#FFFFFF',
  style,
  showDashLine = true,
  dashColor = '#CBD5E1',
  showCenterDot = true,
  centerDotColor = '#FFFFFF',
  centerDotRadius = 4,
}) {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0) setWidth(next);
  }, []);

  const dashY = TICKET_NOTCH_RADIUS;
  const dashStart = TICKET_NOTCH_RADIUS + 1;
  const dashEnd = width - TICKET_NOTCH_RADIUS - 1;

  return (
    <View style={[styles.row, style]} onLayout={onLayout} pointerEvents="none">
      {width > 0 ? (
        <Svg width={width} height={NOTCH_HEIGHT} style={StyleSheet.absoluteFill}>
          {showDashLine && dashEnd > dashStart ? (
            <Line
              x1={dashStart}
              y1={dashY}
              x2={dashEnd}
              y2={dashY}
              stroke={dashColor}
              strokeWidth={1}
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
          ) : null}

          {showCenterDot && showDashLine ? (
            <Circle cx={width / 2} cy={dashY} r={centerDotRadius} fill={centerDotColor} />
          ) : null}

          <Circle cx={0} cy={TICKET_NOTCH_RADIUS} r={NOTCH_DRAW_RADIUS} fill={cutoutColor} />
          <Circle cx={width} cy={TICKET_NOTCH_RADIUS} r={NOTCH_DRAW_RADIUS} fill={cutoutColor} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: NOTCH_HEIGHT,
    width: '100%',
    zIndex: 6,
    overflow: 'visible',
  },
});
