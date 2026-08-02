import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'subtle' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-content hover:opacity-90',
  subtle:
    'bg-surface-raised text-content border border-border-subtle hover:bg-surface-sunken',
  ghost: 'text-content-muted hover:bg-surface-sunken hover:text-content',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = 'subtle',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}
