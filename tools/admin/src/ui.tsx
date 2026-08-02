import type { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm ' +
  'text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none';

export const buttonClass =
  'rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium ' +
  'text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40';

export const primaryButtonClass =
  'rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white ' +
  'hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500';

export const dangerButtonClass =
  'rounded-md border border-red-900 bg-red-950 px-3 py-1.5 text-sm font-medium ' +
  'text-red-300 hover:bg-red-900';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Digimon icon straight from public/, with the id as a fallback. */
export function Icon({ id, size = 24 }: { id: number; size?: number }) {
  return (
    <img
      src={`/icons/thumb/${id}.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded bg-slate-800 object-contain"
      style={{ width: size, height: size }}
      onError={(event) => {
        event.currentTarget.style.visibility = 'hidden';
      }}
    />
  );
}

/**
 * Number inputs here mean "threshold, or absent". An empty field is a real
 * value — it removes the condition — so it maps to undefined rather than 0.
 */
export function NumberInput({
  value,
  onChange,
  placeholder = '—',
  min = 0,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      className={inputClass}
      min={min}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === '' ? undefined : Number(raw));
      }}
    />
  );
}

export function Select<T extends number | string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      className={inputClass}
      value={String(value)}
      onChange={(event) => {
        const next = options.find((o) => String(o.value) === event.target.value);
        if (next) onChange(next.value);
      }}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
