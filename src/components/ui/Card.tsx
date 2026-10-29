import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`panel panel-pad min-w-0 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  id,
  title,
  description,
  icon,
  action,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-soft bg-raised text-gold"
          >
            {icon}
          </span>
        ) : null}
        <div>
          <h2 id={id} className="text-base font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Divider() {
  return <div className="divider" role="presentation" />;
}
