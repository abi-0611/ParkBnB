'use client';

import type { AreaBookingRow, TimeSeriesPoint } from '@parknear/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function BookingsLineChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Legend />
          <Line type="monotone" dataKey="value" name="Bookings" stroke="#0ea5e9" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueBarChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(value) => [`₹${Number(value ?? 0).toFixed(0)}`, 'Revenue']}
          />
          <Bar dataKey="value" name="Service fee (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreasHorizontalChart({ rows }: { rows: AreaBookingRow[] }) {
  const chartData = rows.map((r) => ({ name: r.area.length > 18 ? `${r.area.slice(0, 18)}…` : r.area, count: r.count }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Bar dataKey="count" name="Bookings" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserGrowthChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Legend />
          <Line type="monotone" dataKey="value" name="Cumulative users" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
