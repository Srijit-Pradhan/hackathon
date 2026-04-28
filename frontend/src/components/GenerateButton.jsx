/**
 * GenerateButton
 * Interactive CTA button with a star icon and letter-by-letter text swap
 * between two states (idle label ↔ loading label).
 * Styled to the project palette (forest/paper/grid).
 */

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export function GenerateButton({
  onClick,
  disabled = false,
  idleText = 'Generate',
  loadingText = 'Generating',
  isLoading = false,
}) {
  // Which characters are currently displayed (array of chars)
  const [displayChars, setDisplayChars] = useState(idleText.split(''));

  const targetText = isLoading ? loadingText : idleText;

  useEffect(() => {
    // Swap letters one by one with a staggered delay
    const chars = targetText.split('');
    const timers = chars.map((char, i) =>
      setTimeout(() => {
        setDisplayChars(prev => {
          const next = [...prev];
          next[i] = char;
          // Trim or pad to match target length
          return chars.map((c, j) => (j < i + 1 ? next[j] ?? c : prev[j] ?? ''));
        });
      }, i * 40)
    );

    // After all chars swapped, hard-set to final target (clean state)
    const finalTimer = setTimeout(() => {
      setDisplayChars(chars);
    }, chars.length * 40 + 50);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
  }, [targetText]);

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="group relative inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        background: isLoading ? 'rgba(26,60,43,0.06)' : 'transparent',
        border: '1px solid',
        borderColor: isLoading ? 'rgba(26,60,43,0.25)' : 'rgba(58,58,56,0.2)',
        color: isLoading ? 'rgba(26,60,43,0.5)' : '#1A3C2B',
      }}
    >
      {/* Star icon — spins while loading */}
      <Star
        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-700 ${
          isLoading ? 'animate-spin' : 'group-hover:rotate-90'
        }`}
        style={{
          color: isLoading ? 'rgba(26,60,43,0.4)' : '#1A3C2B',
          animationDuration: isLoading ? '1.5s' : undefined,
        }}
      />

      {/* Letter-by-letter text */}
      <span className="inline-flex overflow-hidden" aria-label={targetText}>
        {displayChars.map((char, i) => (
          <span
            key={i}
            className="inline-block transition-all duration-150"
            style={{ minWidth: char === ' ' ? '0.3em' : undefined }}
          >
            {char}
          </span>
        ))}
      </span>

      {/* Trailing ellipsis when loading */}
      {isLoading && (
        <span className="flex gap-0.5 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="inline-block w-0.5 h-0.5 rounded-full bg-forest/40"
              style={{ animation: `pulse 1s ${i * 0.2}s infinite` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}

export default GenerateButton;
