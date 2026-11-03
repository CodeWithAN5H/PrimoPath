import { useId } from 'react';
import type { ForecastPoint } from '../../domain/forecast';
import { formatNumber } from '../../lib/format';

/**
 * Cumulative wish forecast rendered as plain SVG (no chart dependency).
 * The shape is illustrative; exact values are always shown as text nearby.
 */
export function Sparkline({
  points,
  label,
  height = 120,
}: {
  points: readonly ForecastPoint[];
  label: string;
  height?: number;
}) {
  const gradientId = useId().replace(/[^a-zA-Z0-9-]/g, '');
  if (points.length === 0) return null;

  const width = 640;
  const padX = 6;
  const padY = 12;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const minWishes = Math.min(...points.map((point) => point.wishes), first.wishes);
  const maxWishes = Math.max(...points.map((point) => point.wishes), first.wishes + 1);
  const span = Math.max(1, maxWishes - minWishes);

  const x = (index: number) =>
    points.length === 1 ? width / 2 : padX + (index / (points.length - 1)) * (width - padX * 2);
  const y = (wishes: number) =>
    height - padY - ((wishes - minWishes) / span) * (height - padY * 2);

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point.wishes).toFixed(2)}`,
    )
    .join(' ');
  const area = `${line} L ${x(points.length - 1).toFixed(2)} ${height - padY} L ${x(0).toFixed(2)} ${height - padY} Z`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: from ${formatNumber(first.wishes)} wishes now to ${formatNumber(last.wishes)} wishes by ${last.date}.`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={padY + fraction * (height - padY * 2)}
            y2={padY + fraction * (height - padY * 2)}
            stroke="var(--color-line-soft)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={x(points.length - 1)} cy={y(last.wishes)} r={3.5} fill="var(--color-accent)" />
      </svg>
      <figcaption className="mt-2 flex justify-between text-[11px] text-faint">
        <span className="num">{formatNumber(first.wishes)} now</span>
        <span className="num">{formatNumber(last.wishes)} by deadline</span>
      </figcaption>
    </figure>
  );
}
