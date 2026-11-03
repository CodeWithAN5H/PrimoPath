import { Check, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { forecastSeries, SCENARIOS } from '../../domain/forecast';
import { wishesShortOf } from '../../domain/wishes';
import { formatDeadline, formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Disclosure } from '../ui/Disclosure';
import { Sparkline } from '../ui/Sparkline';

export function ForecastOverviewCard() {
  const { view, state, activeScenario, setActiveScenario } = usePlanner();
  const guaranteeWishes = view.guarantee.worstCaseWishes;

  const series = useMemo(
    () =>
      view.canForecast
        ? forecastSeries(
            {
              resources: state.resources,
              income: state.income,
              oneTimeRewards: state.oneTimeRewards,
            },
            view.today,
            view.plan.endDate,
            activeScenario,
          )
        : [],
    [view.canForecast, view.today, view.plan.endDate, state, activeScenario],
  );

  const scaleMax =
    Math.max(
      guaranteeWishes,
      ...SCENARIOS.map((scenario) => view.projections[scenario.id].projected.wishes),
      1,
    ) * 1.04;
  const guaranteeMarker = `${(guaranteeWishes / scaleMax) * 100}%`;
  const active = view.projections[activeScenario];
  const activeDetails = SCENARIOS.find((scenario) => scenario.id === activeScenario);

  return (
    <section aria-labelledby="forecast-overview-title" className="panel panel-pad lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <TrendingUp size={15} />
          </span>
          <div>
            <h2 id="forecast-overview-title" className="text-sm font-semibold text-ink">
              Forecast by {formatDeadline(view.plan.endDate)}
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              {view.canForecast
                ? `${formatNumber(active.days)} income day${active.days === 1 ? '' : 's'} counted, inclusive of today`
                : 'Waiting for valid banner dates'}
            </p>
          </div>
        </div>
        <span className="chip">Tap a scenario to use it for the gap</span>
      </div>

      {!view.canForecast ? (
        <p className="mt-3 rounded-xl border border-dashed border-line bg-abyss/40 px-3.5 py-3 text-xs leading-relaxed text-faint">
          The banner dates are invalid, so no income is projected. Fix them in the Wish Planner to
          see conservative, expected and optimistic totals.
        </p>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {SCENARIOS.map((scenario) => {
          const projection = view.projections[scenario.id];
          const gap = wishesShortOf(guaranteeWishes, projection.projected);
          const isActive = scenario.id === activeScenario;
          const width = view.canForecast
            ? Math.min(100, (projection.projected.wishes / scaleMax) * 100)
            : 0;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setActiveScenario(scenario.id)}
              aria-pressed={isActive}
              className={`rounded-xl border p-3 text-left transition-colors ${
                isActive
                  ? 'border-accent/40 bg-accent/[0.07]'
                  : 'border-line-soft bg-abyss/40 hover:border-line hover:bg-raised/40'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  {scenario.label}
                </span>
                {isActive ? (
                  <Check size={13} aria-hidden="true" className="text-accent" />
                ) : null}
              </span>
              <span className="num mt-1 block font-display text-2xl leading-none text-ink">
                {view.canForecast ? formatNumber(projection.projected.wishes) : '—'}
              </span>
              <span className="mt-1 block text-[11px] text-faint">
                {view.canForecast
                  ? `+${formatNumber(Math.max(0, projection.gainedWishes))} from income`
                  : scenario.summary}
              </span>

              <span
                aria-hidden="true"
                className="relative mt-2.5 block h-1.5 overflow-hidden rounded-full bg-void/80"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-deep to-accent transition-[width] duration-700 ease-out"
                  style={{ width: `${width}%` }}
                />
                <span
                  className="absolute inset-y-[-2px] w-px bg-ink/50"
                  style={{ left: guaranteeMarker }}
                />
              </span>
              <span
                className={`mt-1.5 block text-[11px] ${
                  !view.canForecast ? 'text-faint' : gap === 0 ? 'text-mint' : 'text-amber'
                }`}
              >
                {!view.canForecast
                  ? 'No projection'
                  : gap === 0
                    ? 'Worst case covered'
                    : `${formatNumber(gap)} short of worst case`}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Marker shows the worst-case guarantee; bars only compare totals, they are not odds.
      </p>

      <Disclosure
        id="forecast-assumptions"
        title="How the forecast is built"
        subtitle="Scenario weights, income days and the assumptions behind every number."
        className="mt-3 border-line-soft bg-abyss/30 shadow-none"
        summary={
          <span className="hidden text-[11px] text-faint sm:inline">{activeDetails?.label}</span>
        }
      >
        {view.canForecast ? (
          <div className="rounded-xl border border-line-soft bg-abyss/40 p-2.5">
            <Sparkline points={series} label={`${activeScenario} cumulative wishes`} />
          </div>
        ) : null}

        <ul className="mt-3 space-y-2">
          {SCENARIOS.map((scenario) => (
            <li key={scenario.id} className="text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">{scenario.label}:</span> {scenario.detail}
            </li>
          ))}
        </ul>

        <ol className="mt-3 space-y-1.5 border-t border-line-soft pt-3">
          {view.assumptions.map((line, index) => (
            <li key={line} className="flex gap-2 text-[11px] leading-relaxed text-faint">
              <span className="num shrink-0 text-faint/80">{index + 1}.</span>
              {line}
            </li>
          ))}
        </ol>
      </Disclosure>
    </section>
  );
}
