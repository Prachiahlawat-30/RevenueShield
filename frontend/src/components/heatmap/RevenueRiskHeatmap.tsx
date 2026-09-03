import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, ShieldCheck, Flame, RefreshCw } from 'lucide-react';
import { getRevenueRiskHeatmap } from '../../api/tier3';
import { RevenueRiskHeatmapResponse, HeatmapCell } from '../../types';

export const RevenueRiskHeatmap: React.FC = () => {
  const [data, setData] = useState<RevenueRiskHeatmapResponse | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getRevenueRiskHeatmap()
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error('Failed to load heatmap:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-8 text-center text-fintech-muted text-xs animate-pulse">
        Generating temporal payment failure heatmap across rails...
      </div>
    );
  }

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-fintech-primary">
              Temporal Failure Heatmap & Retry Window Calibration
            </h3>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Identify peak decline windows and safe retry execution slots based on historical authorization velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> &lt;20% Low
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 20-40% Mid
          </span>
          <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> &gt;40% High Risk
          </span>
        </div>
      </div>

      {/* Grid + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Heatmap Matrix Table */}
        <div className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-[10px] font-mono text-fintech-muted uppercase text-left">Window</th>
                {data.days.map((day) => (
                  <th key={day} className="p-2 text-[10px] font-mono text-fintech-muted uppercase">
                    {day.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.time_slots.map((slot) => (
                <tr key={slot}>
                  <td className="p-2 text-xs font-mono font-semibold text-fintech-secondary text-left whitespace-nowrap">
                    {slot}
                  </td>
                  {data.days.map((day) => {
                    const cell = data.matrix.find(
                      (c) => c.day_of_week === day && (c.hour_label === slot || `${c.hour_24}:00` === slot)
                    );
                    if (!cell) return <td key={day} className="p-1" />;

                    const ratePct = cell.failure_rate_pct;
                    let bgClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
                    if (ratePct >= 40 || cell.risk_level === 'HIGH') {
                      bgClass = 'bg-rose-500/30 border-rose-500/50 text-rose-700 dark:text-rose-300 font-bold';
                    } else if (ratePct >= 20 || cell.risk_level === 'MEDIUM') {
                      bgClass = 'bg-amber-500/25 border-amber-500/40 text-amber-700 dark:text-amber-300';
                    }

                    return (
                      <td key={day} className="p-1">
                        <button
                          onMouseEnter={() => setHoveredCell(cell)}
                          className={`w-full py-2.5 px-1 rounded-fintech-sm border font-mono text-[11px] transition-all hover:scale-105 hover:shadow-fintech-sm ${bgClass}`}
                        >
                          {ratePct.toFixed(0)}%
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Cell Deep-Dive Card */}
        <div className="lg:col-span-4 p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-3 shadow-fintech-sm">
          <div className="flex items-center justify-between border-b border-fintech-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-fintech-primary font-mono">
              Window Telemetry Details
            </span>
            <Clock className="w-4 h-4 text-brand-500" />
          </div>

          {hoveredCell ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-fintech-muted">Time Window:</span>
                <span className="font-bold text-fintech-primary">
                  {hoveredCell.day_of_week} ({hoveredCell.hour_label})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Decline Rate:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {hoveredCell.failure_rate_pct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Sampled Volume:</span>
                <span className="font-mono font-bold text-fintech-primary">{hoveredCell.transaction_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Failed Invoices:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{hoveredCell.failure_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Risk Category:</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                  {hoveredCell.risk_level}
                </span>
              </div>

              <div className="pt-2 border-t border-fintech-border space-y-1">
                <span className="text-[10px] font-bold text-fintech-muted uppercase block font-mono">
                  RevenueShield Timing Recommendation
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {hoveredCell.failure_rate_pct > 35
                    ? '⚠️ Avoid auto-retry in this window. Defer execution by +14 hours.'
                    : '✅ High conversion window. Immediate retry authorized.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-fintech-muted text-xs">
              Hover over any cell on the left to inspect decline rate and timing recommendation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
