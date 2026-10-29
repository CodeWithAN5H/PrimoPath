import { useEffect, useState, type ReactNode } from 'react';
import { parseIntegerField } from '../../domain/validation';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode | undefined;
  error?: string | null | undefined;
  children: ReactNode;
  suffix?: string | undefined;
}

function FieldShell({ id, label, hint, error, children, suffix }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint"
          >
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs leading-relaxed text-ember" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  hint,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  hint?: ReactNode;
  suffix?: string;
}) {
  const [text, setText] = useState(() => String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} suffix={suffix}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const result = parseIntegerField(raw, { min, max, label });
          setError(result.error);
          if (!result.error && result.value !== null && result.value !== value) {
            onChange(result.value);
          }
        }}
        onBlur={() => {
          if (!error) setText(String(value));
        }}
        className={`field num ${error ? 'field-invalid' : ''} ${suffix ? 'pr-24' : ''}`}
      />
    </FieldShell>
  );
}

export function DateField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: ReactNode;
  min?: string;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`field num appearance-none ${error ? 'field-invalid' : ''}`}
      />
    </FieldShell>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: ReactNode;
  error?: string | null;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`field ${error ? 'field-invalid' : ''}`}
      />
    </FieldShell>
  );
}

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line-soft bg-void/40 px-3.5 py-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-ink">
          {label}
        </p>
        {description ? (
          <p id={`${id}-description`} className="mt-1 text-xs leading-relaxed text-faint">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition after:absolute after:-inset-2 after:content-[''] ${
          checked ? 'border-gold/60 bg-gold/30' : 'border-line bg-raised'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 size-5 rounded-full transition-all ${
            checked ? 'left-[22px] bg-gold' : 'left-0.5 bg-faint'
          }`}
        />
      </button>
    </div>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: ReactNode;
}) {
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field appearance-none bg-void/80"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-panel text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
