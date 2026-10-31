import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { fmt } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="card"
        style={{
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.82rem',
          minWidth: '140px'
        }}
      >
        <p className="font-semibold text-muted text-xs mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div
            key={`tooltip-${idx}`}
            className="flex items-center justify-between gap-3 font-bold"
            style={{ color: entry.color }}
          >
            <span>{entry.name}:</span>
            <span>{fmt(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GrossProfitChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty py-12">
        <b>No profit data available yet</b>
        <p className="text-sm text-muted mt-1">
          Sales transactions over the last 30 days will appear here.
        </p>
      </div>
    );
  }

  const kfmt = (v) => {
    if (v === 0) return '0';
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(v);
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--line)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="displayDate"
            stroke="var(--muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
            interval={4}
          />
          <YAxis
            stroke="var(--muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
            tickFormatter={kfmt}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="grossProfit"
            name="Gross Profit"
            stroke="var(--brand2)"
            strokeWidth={3}
            dot={{ r: 2.5, fill: 'var(--brand2)', strokeWidth: 0 }}
            activeDot={{ r: 5.5, fill: 'var(--brand)' }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            name="Total Sales"
            stroke="var(--gold)"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrossProfitChart;
