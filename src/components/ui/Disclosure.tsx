import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/**
 * Accessible expandable section.
 *
 * The panel stays mounted so the grid-row transition can animate height without
 * measuring anything; `inert` keeps collapsed controls out of the tab order and
 * screen-reader flow. Reduced-motion users get an instant toggle via the global
 * CSS override.
 */
export function Disclosure({
  id,
  title,
  subtitle,
  summary,
  defaultOpen = false,
  children,
  className = '',
}: {
  id: string;
  title: string;
  subtitle?: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${id}-panel`;

  return (
    <div className={`panel overflow-hidden ${className}`}>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-raised/40 sm:px-5"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-ink">{title}</span>
            {subtitle ? (
              <span className="mt-0.5 block text-xs leading-relaxed text-faint">{subtitle}</span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {summary}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`text-faint transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line-soft px-4 pb-4 pt-4 sm:px-5 sm:pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
