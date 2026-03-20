import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEuroFromCents, formatDateNl } from "@/lib/format";
import { Button } from "@/components/ui/button";

type SearchParams = {
  connectSuccess?: string;
  connectError?: string;
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
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

      {params.connectSuccess ? (
        <p className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Connector authorization successful.</p>
      ) : null}
      {params.connectError ? (
        <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">Connector error: {params.connectError}</p>
      ) : null}

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
                {account.connection?.status ? <p className="text-xs text-slate-500">Status: {account.connection.status}</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                <form action="/api/sync" method="post">
                  <input type="hidden" name="accountId" value={account.id} />
                  <Button type="submit">Sync now</Button>
                </form>
                <form action="/api/connect" method="post" className="flex gap-2">
                  <input type="hidden" name="accountId" value={account.id} />
                  <select
                    name="provider"
                    defaultValue={account.connection?.provider ?? "ABN_AMRO"}
                    className="rounded-lg border border-white/20 bg-slate-950 px-2 py-1 text-xs"
                  >
                    <option value="ABN_AMRO">ABN AMRO</option>
                    <option value="ICS">ICS</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="BITVAVO">Bitvavo</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                  <Button type="submit" variant="ghost">
                    {account.connection?.encryptedToken ? "Reconnect" : "Connect"}
                  </Button>
                </form>
              </div>
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
