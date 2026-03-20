"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuroFromCents } from "@/lib/format";

type SpendingPoint = {
  month: string;
  totalCents: number;
};

export function SpendingChart({ data }: { data: SpendingPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => formatEuroFromCents(value * 100)} />
          <Tooltip
            formatter={(value) => formatEuroFromCents(Math.round(Number(value) * 100))}
            contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12 }}
          />
          <Bar dataKey="totalCents" fill="#60a5fa" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
