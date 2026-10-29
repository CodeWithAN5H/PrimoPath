import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { forecastSeries, SCENARIOS } from '../../domain/forecast';
import { wishesShortOf } from '../../domain/wishes';
import { formatDeadline, formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Card, CardHeader } from '../ui/Card';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Sparkline } from '../ui/Sparkline';

export function ForecastCard() {
  const { view, state, activeScenario, setActiveScenario } = usePlanner();

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

  const active = view.projections[activeScenario];
  const perDay = active.days > 0 ? active.gainedWishes / active.days : 0;

  return (
    <Card labelledBy="forecast-title" className="lg:col-span-2">
      <CardHeader
        id="forecast-title"
        title="Income forecast"
        description={`Projected budget at ${formatDeadline(view.plan.endDate)} under each income scenario.`}
        icon={<TrendingUp size={16} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Income scenario"
          value={activeScenario}
          onChange={setActiveScenario}
          options={SCENARIOS.map((scenario) => ({
            value: scenario.id,
            label: scenario.label,
            hint: scenario.summary,
          }))}
        />
        <p className="text-xs text-faint">
          {active.days > 0
            ? `≈ ${perDay.toFixed(2)} wishes/day · ${(perDay * 7).toFixed(1)} per week`
            : 'No future days in range'}
        </p>
      </div>

      {view.canForecast ? (
        <div className="mt-4 rounded-xl border border-line-soft bg-void/30 p-3">
          <Sparkline points={series} label={`${activeScenario} cumulative wishes`} />
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-void/30 px-4 py-6 text-center text-sm text-faint">
          Add valid banner dates in the Wish Planner to see a forecast.
        </p>
      )}

      <div className="mt-4 overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <caption className="sr-only">
            Wish totals by income scenario compared with the worst-case guarantee
          </caption>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-faint">
              <th scope="col" className="pb-2 font-medium">
                Scenario
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Income
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Total
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Guarantee gap
              </th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((scenario) => {
              const projection = view.projections[scenario.id];
              const gap = wishesShortOf(view.guarantee.worstCaseWishes, projection.projected);
              const isActive = scenario.id === activeScenario;
              return (
                <tr
                  key={scenario.id}
                  className={`border-t border-line-soft/70 ${isActive ? 'bg-raised/50' : ''}`}
                >
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">
                    <span className="flex items-center gap-2">
                      {scenario.label}
                      {isActive ? (
                        <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                          shown
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-normal text-faint">
                      {scenario.summary}
                    </span>
                  </th>
                  <td className="num py-2.5 text-right text-muted">
                    {view.canForecast
                      ? `+${formatNumber(projection.gainedWishes)}`
                      : '—'}
                  </td>
                  <td className="num py-2.5 text-right font-semibold text-ink">
                    {view.canForecast ? formatNumber(projection.projected.wishes) : '—'}
                  </td>
                  <td
                    className={`num py-2.5 text-right ${
                      !view.canForecast ? 'text-faint' : gap === 0 ? 'text-mint' : 'text-amber'
                    }`}
                  >
                    {!view.canForecast ? '—' : gap === 0 ? 'Covered' : `${formatNumber(gap)} short`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        Guarantee gap compares each scenario with the worst-case wish cost explained in the
        guarantee card. Scenarios only change how much listed one-time income is counted.
      </p>
    </Card>
  );
}
