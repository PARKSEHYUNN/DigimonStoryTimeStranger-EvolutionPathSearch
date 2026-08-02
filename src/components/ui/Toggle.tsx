'use client';

import { useId } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hides the visible label but keeps it for assistive tech. */
  hideLabel?: boolean;
}

export function Toggle({ checked, onChange, label, hideLabel }: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-2.5">
      {/* The switch reads as 36x20, but the button around it is padded out to
          24px tall so the tap target clears the WCAG 2.2 AA minimum. */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        onClick={() => onChange(!checked)}
        className="flex h-6 shrink-0 cursor-pointer items-center rounded-full focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
      >
        <span
          className={`relative block h-5 w-9 rounded-full transition-colors ${
            checked ? 'bg-accent' : 'bg-border-subtle'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
      </button>
      {!hideLabel && (
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-content select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
}
