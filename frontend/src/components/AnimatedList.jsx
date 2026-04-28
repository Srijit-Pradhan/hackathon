/**
 * AnimatedList component
 * Adapted from TSX to plain JSX.
 * Re-themed to project palette: paper background, forest text.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── AnimatedItem ─────────────────────────────────────────────────────────────
function AnimatedItem({ children, index, onMouseEnter, onClick }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="mb-1.5 cursor-pointer"
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedList ─────────────────────────────────────────────────────────────
export function AnimatedList({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  // Palette override props
  gradientColor = '#F7F7F5', // paper — used for top/bottom fade gradient
}) {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const handleMouseEnter = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  const handleClick = useCallback((item, index) => {
    setSelectedIndex(index);
    onItemSelect?.(item, index);
  }, [onItemSelect]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopOpacity(Math.min(scrollTop / 40, 1));
    const bottom = scrollHeight - (scrollTop + clientHeight);
    setBottomOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottom / 40, 1));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!enableArrowNavigation) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onItemSelect?.(items[selectedIndex], selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  // Auto-scroll to selected item during keyboard nav
  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const el = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      const margin = 40;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (top < container.scrollTop + margin) {
        container.scrollTo({ top: top - margin, behavior: 'smooth' });
      } else if (bottom > container.scrollTop + container.clientHeight - margin) {
        container.scrollTo({ top: bottom - container.clientHeight + margin, behavior: 'smooth' });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={`relative ${className}`}>
      {/* Scrollable list */}
      <div
        ref={listRef}
        className="max-h-[260px] overflow-y-auto p-2"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
          scrollbarColor: 'rgba(26,60,43,0.2) transparent',
        }}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            index={index}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleClick(item, index)}
          >
            <div
              className={`px-3 py-2 text-xs font-mono transition-colors duration-150 ${itemClassName}`}
              style={{
                background: selectedIndex === index
                  ? 'rgba(26,60,43,0.08)'
                  : 'transparent',
                borderLeft: selectedIndex === index
                  ? '2px solid #1A3C2B'
                  : '2px solid transparent',
                color: selectedIndex === index ? '#1A3C2B' : 'rgba(58,58,56,0.7)',
              }}
            >
              {item}
            </div>
          </AnimatedItem>
        ))}
      </div>

      {/* Top fade gradient */}
      {showGradients && (
        <div
          className="absolute top-0 left-0 right-0 h-10 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: topOpacity,
            background: `linear-gradient(to bottom, ${gradientColor}, transparent)`,
          }}
        />
      )}

      {/* Bottom fade gradient */}
      {showGradients && (
        <div
          className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: bottomOpacity,
            background: `linear-gradient(to top, ${gradientColor}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

export default AnimatedList;
