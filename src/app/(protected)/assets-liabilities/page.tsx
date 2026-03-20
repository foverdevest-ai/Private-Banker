import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateNl, formatEuroFromCents } from "@/lib/format";

export default async function AssetsLiabilitiesPage() {
  const user = await getCurrentUserOrThrow();
  const memberships = await prisma.entityMembership.findMany({
    where: { userId: user.id },
    include: {
      entity: {
        include: {
          assets: { include: { valuations: { orderBy: { effectiveDate: "desc" }, take: 4 }, property: true } },
          liabilities: {
            include: { valuations: { orderBy: { effectiveDate: "desc" }, take: 4 }, mortgage: { include: { snapshots: { orderBy: { effectiveDate: "desc" }, take: 4 } } } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Assets & Liabilities</h2>
      {memberships.map((membership) => (
        <section key={membership.entity.id} className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
          <h3 className="text-lg text-white">
            {membership.entity.name} ({membership.entity.type})
          </h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Assets</p>
              <div className="mt-2 space-y-2">
                {membership.entity.assets.map((asset) => (
                  <div key={asset.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm">
                    <p className="text-white">{asset.name}</p>
                    <p className="text-slate-300">{asset.type}</p>
                    <p className="text-slate-200">{formatEuroFromCents(asset.valuations[0]?.valueCents ?? 0n)}</p>
                    {asset.property ? (
                      <p className="text-xs text-slate-400">
                        WOZ {asset.property.latestWozYear}: {formatEuroFromCents(asset.property.latestWozValueCents ?? 0n)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Liabilities</p>
              <div className="mt-2 space-y-2">
                {membership.entity.liabilities.map((liability) => (
                  <div key={liability.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm">
                    <p className="text-white">{liability.name}</p>
                    <p className="text-slate-300">{liability.type}</p>
                    <p className="text-slate-200">{formatEuroFromCents(liability.valuations[0]?.valueCents ?? 0n)}</p>
                    {liability.mortgage ? (
                      <p className="text-xs text-slate-400">
                        {liability.mortgage.lender} · {liability.mortgage.interestRatePct.toFixed(2)}% · last snapshot{" "}
                        {liability.mortgage.snapshots[0] ? formatDateNl(liability.mortgage.snapshots[0].effectiveDate) : "n/a"}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
