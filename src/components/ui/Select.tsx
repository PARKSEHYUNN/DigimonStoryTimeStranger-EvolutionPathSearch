'use client';

import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ label, value, onChange, children }: SelectProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-content-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface-raised py-2 pr-9 pl-3 text-sm text-content focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-content-muted"
        />
      </div>
    </div>
  );
}
