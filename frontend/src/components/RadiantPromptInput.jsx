import { useState } from 'react';
import { Send } from 'lucide-react';

// RadiantPromptInput — adapted from the Radiant Prompt Input component
// Colours mapped to the project palette: forest / paper / grid / coral
export function RadiantPromptInput({
  placeholder = 'Post a live update...',
  value: propValue,
  onChange: propOnChange,
  onSubmit,
  disabled = false,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = propValue !== undefined;
  const value = isControlled ? propValue : internalValue;

  const handleChange = (e) => {
    if (!isControlled) setInternalValue(e.target.value);
    propOnChange?.(e.target.value);
  };

  const handleSubmit = () => {
    if (!disabled) {
      onSubmit?.(value);
      if (!isControlled) setInternalValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`radiant-input-wrapper relative rounded-full w-full ${className}`}>
      {/* Animated gradient border layer */}
      <div className="radiant-input-border rounded-full" />

      {/* Inner content */}
      <div className="relative z-10 flex items-center gap-2 px-4 h-12 bg-paper rounded-full">
        {/* Text Input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-forest placeholder:text-grid/40 font-mono text-sm w-full min-w-0"
        />

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          aria-label="Send update"
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 shrink-0 ${
            !disabled
              ? 'bg-forest text-paper hover:scale-105 active:scale-95'
              : 'bg-grid/10 text-grid/30 cursor-not-allowed'
          }`}
        >
          <Send size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default RadiantPromptInput;
