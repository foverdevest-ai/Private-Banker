import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents, formatDateNl } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function AccountsPage() {
  const user = await getCurrentUserOrThrow();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    include: { entity: true, connection: true, balanceHistory: { orderBy: { effectiveDate: "desc" }, take: 6 } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">Accounts</h2>
      <p className="mt-1 text-sm text-slate-300">Connected and manual accounts with explicit sync controls.</p>
      <div className="mt-5 space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-white">{account.name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  {account.entity.type} · {account.kind} · {account.connection?.provider ?? "MANUAL"}
                </p>
                <p className="mt-1 text-sm text-slate-300">Balance: {formatEuroFromCents(account.currentBalanceCents)}</p>
                <p className="text-xs text-slate-400">
                  Last sync: {account.connection?.lastSyncAt ? formatDateNl(account.connection.lastSyncAt) : "Never"}
                </p>
              </div>
              <form action="/api/sync" method="post">
                <input type="hidden" name="accountId" value={account.id} />
                <Button type="submit">Sync now</Button>
              </form>
            </div>
            {account.balanceHistory.length > 0 ? (
              <div className="mt-3 text-xs text-slate-300">
                Recent history:{" "}
                {account.balanceHistory.map((item) => `${formatDateNl(item.effectiveDate)} ${formatEuroFromCents(item.balanceCents)}`).join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
