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
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex flex-wrap gap-1.5 rounded-xl border border-line-soft bg-abyss/40 p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`min-h-9 flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              active
                ? 'border-accent/40 bg-accent/15 text-accent-soft'
                : 'border-transparent text-muted hover:bg-raised hover:text-ink'
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
