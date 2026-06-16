import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';

// 34px circular status chip — dark bg, #22CC5E border, angular "face" eyes.
// Eyes: two 8×3 rectangles with 4px horizontal gap, centered in the circle.
// Glow: a slightly larger, low-opacity rect drawn first behind each eye.

export function VoltChip() {
  // Eye geometry
  // Total eye strip width: 8 + 4 + 8 = 20px
  // Start x: (34 - 20) / 2 = 7
  // Eye y center: 34 / 2 = 17 → top = 17 - 1.5 = 15.5
  const eyeY = 15.5;
  const leftX = 7;
  const rightX = 19; // leftX + 8 (eye) + 4 (gap)

  return (
    <Svg width={34} height={34} viewBox="0 0 34 34">
      {/* Container circle */}
      <Circle
        cx={17}
        cy={17}
        r={15.25}
        fill="#111111"
        stroke="#22CC5E"
        strokeWidth={1.5}
      />

      {/* Glow behind left eye */}
      <Rect
        x={leftX - 2}
        y={eyeY - 2.5}
        width={12}
        height={8}
        rx={2}
        fill="#22CC5E"
        opacity={0.18}
      />
      {/* Glow behind right eye */}
      <Rect
        x={rightX - 2}
        y={eyeY - 2.5}
        width={12}
        height={8}
        rx={2}
        fill="#22CC5E"
        opacity={0.18}
      />

      {/* Left eye */}
      <Rect
        x={leftX}
        y={eyeY}
        width={8}
        height={3}
        rx={0.5}
        fill="#22CC5E"
      />
      {/* Right eye */}
      <Rect
        x={rightX}
        y={eyeY}
        width={8}
        height={3}
        rx={0.5}
        fill="#22CC5E"
      />
    </Svg>
  );
}
