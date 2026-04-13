'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export function AnalyticsCharts({
  pieData,
  rolePie,
  trend,
  areaBars,
}: {
  pieData: { name: string; value: number }[];
  rolePie: { name: string; value: number }[];
  trend: { date: string; value: number }[];
  areaBars: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Revenue by booking type (completed)">
        <div className="h-64 min-h-[16rem] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${Number(value ?? 0).toFixed(0)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Users by role">
        <div className="h-64 min-h-[16rem] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {rolePie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Revenue trend (daily, completed)">
        <div className="h-64 min-h-[16rem] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 126, 255, 0.16)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8B9FD4" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8B9FD4" }} />
              <Tooltip formatter={(value) => `₹${Number(value ?? 0).toFixed(0)}`} />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <ChartCard title="Spots by area (count)">
        <div className="h-64 min-h-[16rem] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 126, 255, 0.16)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8B9FD4" }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fill: "#8B9FD4" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border-token bg-bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold text-txt-primary">{title}</h2>
      {children}
    </div>
  );
}
