/**
 * RollingCounter component
 * Adapted from the RollingCounter TSX component to plain JSX.
 * Uses framer-motion for smooth mechanical digit transitions.
 * Colors mapped to project palette: forest / paper / grid
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

// Renders a single animated digit (0-9) that slides vertically
function Number({ mv, number, height }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) memo -= 10 * height;
    return memo;
  });

  return (
    <motion.span
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        y,
      }}
    >
      {number}
    </motion.span>
  );
}

// Handles only NUMERIC digit slots — hooks are safe here (always called)
function NumericDigit({ place, value, height }) {
  const valueRoundedToPlace = Math.floor(value / place);

  // Start from 0 so the spring animates up to the real value on mount
  const animatedValue = useSpring(0, {
    damping: 20,
    stiffness: 100,
    mass: 1,
  });

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <span
      style={{
        height,
        position: 'relative',
        width: '1ch',
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-flex',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

// Router — decimal point renders a static dot, numbers go to NumericDigit
// Splitting avoids calling hooks after a conditional return (Rules of Hooks)
function Digit({ place, value, height }) {
  if (place === '.') {
    return (
      <span
        style={{
          height,
          display: 'inline-flex',
          alignItems: 'flex-end',
          paddingBottom: '2px',
        }}
      >
        .
      </span>
    );
  }
  return <NumericDigit place={place} value={value} height={height} />;
}

/**
 * RollingCounter
 *
 * Props:
 *  value             — number to display
 *  fontSize          — px (default 48)
 *  padding           — vertical padding per digit (default 0)
 *  places            — custom place array e.g. [100, 10, 1, '.', 0.1]
 *  gap               — gap between digits in px (default 4)
 *  borderRadius      — container border radius (default 0)
 *  horizontalPadding — container horizontal padding (default 4)
 *  textColor         — css color string (default forest #1A3C2B)
 *  fontWeight        — css font-weight (default 700)
 *  gradientHeight    — gradient overlay height in px (default 12)
 *  gradientFrom      — start color of fade gradient (default paper #F7F7F5)
 *  gradientTo        — end color of fade gradient (default transparent)
 */
export function RollingCounter({
  value,
  fontSize = 48,
  padding = 0,
  places,
  gap = 4,
  borderRadius = 0,
  horizontalPadding = 4,
  textColor = '#1A3C2B',    // forest
  fontWeight = 700,
  gradientHeight = 12,
  gradientFrom = '#F7F7F5', // paper
  gradientTo = 'transparent',
}) {
  const height = fontSize + padding;

  // Auto-detect place values from the number string if not provided
  const derivedPlaces = places || [...value.toString()].map((ch, i, a) => {
    if (ch === '.') return '.';
    const dotIndex = a.indexOf('.');
    const isInteger = dotIndex === -1;
    const exponent = isInteger
      ? a.length - i - 1
      : i < dotIndex
        ? dotIndex - i - 1
        : -(i - dotIndex);
    return 10 ** exponent;
  });

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {/* Digit row */}
      <span
        style={{
          fontSize,
          fontFamily: 'inherit',
          display: 'flex',
          gap,
          overflow: 'hidden',
          borderRadius,
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
          lineHeight: 1,
          color: textColor,
          fontWeight,
        }}
      >
        {derivedPlaces.map((place, idx) => (
          <Digit
            key={`${place}-${idx}`}
            place={place}
            value={value}
            height={height}
          />
        ))}
      </span>

      {/* Top + bottom gradient overlays — the "odometer" fade */}
      <span
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            height: gradientHeight,
            background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
            zIndex: 10,
          }}
        />
        <span
          style={{
            height: gradientHeight,
            background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
            zIndex: 10,
          }}
        />
      </span>
    </span>
  );
}

export default RollingCounter;
