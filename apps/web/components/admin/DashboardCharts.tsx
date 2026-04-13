"use client";

import type { AreaBookingRow, TimeSeriesPoint } from "@parknear/shared";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// ─── Shared dark chart config ────────────────────────────────
const GRID_COLOR   = "rgba(99,126,255,0.08)";
const AXIS_COLOR   = "#4B5A8A";
const TICK_STYLE   = { fontSize: 10, fill: "#4B5A8A" };

function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  formatter?: (v: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-token bg-bg-elevated px-3 py-2 shadow-elevated text-xs">
      {label && <p className="mb-1 font-semibold text-txt-secondary">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {formatter ? formatter(p.value, p.name) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

export function BookingsLineChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-56 min-h-[14rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <Tooltip
            content={(props) => (
              <DarkTooltip
                active={props.active}
                payload={props.payload as unknown as { value: number; name: string; color: string }[]}
                label={props.label as string}
                formatter={(v) => `${v} bookings`}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Bookings"
            stroke="#3D7BFF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3D7BFF", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueBarChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-56 min-h-[14rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <YAxis tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <Tooltip
            content={(props) => (
              <DarkTooltip
                active={props.active}
                payload={props.payload as unknown as { value: number; name: string; color: string }[]}
                label={props.label as string}
                formatter={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
              />
            )}
          />
          <Bar dataKey="value" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreasHorizontalChart({ rows }: { rows: AreaBookingRow[] }) {
  const chartData = rows.map((r) => ({
    name: r.area.length > 16 ? `${r.area.slice(0, 16)}…` : r.area,
    count: r.count,
  }));
  return (
    <div className="h-56 min-h-[14rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={90} tick={{ ...TICK_STYLE, fontSize: 9 }} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <Tooltip
            content={(props) => (
              <DarkTooltip
                active={props.active}
                payload={props.payload as unknown as { value: number; name: string; color: string }[]}
                label={props.label as string}
                formatter={(v) => `${v} bookings`}
              />
            )}
          />
          <Bar dataKey="count" name="Bookings" fill="#00AAFF" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserGrowthChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-56 min-h-[14rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis dataKey="label" tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={TICK_STYLE} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
          <Tooltip
            content={(props) => (
              <DarkTooltip
                active={props.active}
                payload={props.payload as unknown as { value: number; name: string; color: string }[]}
                label={props.label as string}
                formatter={(v) => `${v} users`}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Users"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
