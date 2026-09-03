import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Filter, TrendingUp } from 'lucide-react';
import { AuthorizationFunnelResponse } from '../../types';
import { getAuthorizationFunnel } from '../../api/authorization';
import { useTheme } from '../../context/ThemeContext';

export const AuthorizationFunnelChart: React.FC = () => {
  const { isDark } = useTheme();
  const [funnelData, setFunnelData] = useState<AuthorizationFunnelResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        setLoading(true);
        const data = await getAuthorizationFunnel();
        setFunnelData(data);
      } catch (err) {
        console.error('Failed to load authorization funnel', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFunnel();
  }, []);

  if (loading || !funnelData) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-8 text-center text-fintech-muted text-xs animate-pulse">
        Loading Pre-Authorization Conversion Funnel...
      </div>
    );
  }

  const chartData = funnelData.stages.map((s) => ({
    name: s.stage_name,
    Baseline: s.baseline_count,
    'RevenueShield Optimized': s.optimized_count,
    lift: s.lift_pct,
  }));

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fintech-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-fintech-primary">Pre-Authorization Conversion Funnel</h3>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Checkout intent to completed payment: Baseline vs RevenueShield Adaptive Strategy
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-fintech-md">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {funnelData.total_revenue_lift_formatted}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f1420' : '#ffffff',
                borderColor: isDark ? '#263247' : '#e2e8f0',
                color: isDark ? '#f8fafc' : '#0f172a',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(val) => (
                <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>{val}</span>
              )}
            />
            <Bar dataKey="Baseline" fill={isDark ? '#475569' : '#94a3b8'} radius={[4, 4, 0, 0]} />
            <Bar dataKey="RevenueShield Optimized" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
