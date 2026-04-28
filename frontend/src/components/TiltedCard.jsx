/**
 * TiltedCard component
 * Adapted from TiltedCard TSX to plain JSX.
 * Colors mapped to project palette: forest / paper / grid.
 */

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  imageHeight = '300px',
  imageWidth = '300px',
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  className = '',
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });
  const [lastY, setLastY] = useState(0);

  function handleMouse(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  return (
    <figure
      ref={ref}
      className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}
      style={{
        height: containerHeight,
        width: containerWidth,
        perspective: '800px',
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="absolute top-4 text-center text-sm block sm:hidden font-mono text-grid/60">
          This effect is optimized for desktop.
        </div>
      )}

      <motion.div
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
      >
        <motion.img
          src={imageSrc}
          alt={altText}
          className="tilted-card-img absolute top-0 left-0 object-cover will-change-transform"
          style={{
            width: imageWidth,
            height: imageHeight,
            borderRadius: '12px',
            border: '1px solid rgba(58,58,56,0.15)',
            transform: 'translateZ(0)',
          }}
        />

        {displayOverlayContent && overlayContent && (
          <motion.div
            className="absolute top-0 left-0 w-full h-full flex items-end justify-start pointer-events-none"
            style={{ transform: 'translateZ(30px)', zIndex: 2 }}
          >
            {overlayContent}
          </motion.div>
        )}
      </motion.div>

      {/* Cursor-following tooltip */}
      {showTooltip && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 hidden sm:block whitespace-nowrap font-mono text-[10px] uppercase tracking-widest z-[3]"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
            backgroundColor: '#1A3C2B',
            color: '#F7F7F5',
            padding: '4px 10px',
            borderRadius: '2px',
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}

export default TiltedCard;
