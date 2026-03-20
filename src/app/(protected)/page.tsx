import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { SpendingChart } from "@/components/charts/spending-chart";
import { QuickAskPanel } from "@/components/dashboard/quick-ask";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { formatEuroFromCents, percent } from "@/lib/format";

export default async function DashboardPage() {
  const user = await getCurrentUserOrThrow();
  const data = await getDashboardData(user.id);
  const trendPoints = data.entities
    .flatMap((entity) => entity.netWorthSnapshots)
    .map((snapshot) => ({
      date: snapshot.date.toISOString().slice(0, 10),
      netWorthCents: Number(snapshot.netWorthCents) / 100,
    }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Overview</p>
          <h2 className="text-3xl font-semibold text-white">Total net worth {formatEuroFromCents(data.totalNetWorth)}</h2>
          <p className="mt-1 text-sm text-slate-300">
            Assets {formatEuroFromCents(data.totalAssets)} vs liabilities {formatEuroFromCents(data.totalLiabilities)}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle>Total Assets</CardTitle>
          <CardValue>{formatEuroFromCents(data.totalAssets)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Total Liabilities</CardTitle>
          <CardValue>{formatEuroFromCents(data.totalLiabilities)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Subscriptions</CardTitle>
          <CardValue>{String(data.subscriptions.length)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Mortgage Rate</CardTitle>
          <CardValue>{data.mortgage ? percent(data.mortgage.interestRatePct) : "N/A"}</CardValue>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardTitle>Net Worth Over Time</CardTitle>
          <div className="mt-4">
            <NetWorthChart points={trendPoints} />
          </div>
        </Card>
        <QuickAskPanel />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Monthly Spending</CardTitle>
          <div className="mt-4">
            <SpendingChart
              data={data.spendingByMonth.map((item) => ({
                month: item.month,
                totalCents: Number(item.totalCents) / 100,
              }))}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Entity Breakdown</CardTitle>
          <div className="mt-4 space-y-3">
            {data.entities.map((entity) => (
              <div key={entity.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>
                    {entity.name} ({entity.type})
                  </span>
                  <span>{formatEuroFromCents(entity.netWorthCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
