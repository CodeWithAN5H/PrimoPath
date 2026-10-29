export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-2.5 text-sm transition ${
              active
                ? 'border-gold/50 bg-gold/15 text-gold'
                : 'border-line bg-void/40 text-muted hover:border-line hover:bg-raised hover:text-ink'
            }`}
            title={option.hint}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
