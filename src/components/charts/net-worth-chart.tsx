"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuroFromCents } from "@/lib/format";

type Point = {
  date: string;
  netWorthCents: number;
};

export function NetWorthChart({ points }: { points: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => formatEuroFromCents(value * 100)} />
          <Tooltip
            formatter={(value) => formatEuroFromCents(Math.round(Number(value) * 100))}
            contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }}
          />
          <Area type="monotone" dataKey="netWorthCents" stroke="#34d399" fill="url(#netWorthFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
