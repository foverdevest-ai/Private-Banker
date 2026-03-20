import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { formatDateNl, formatEuroFromCents } from "@/lib/format";

type SearchParams = {
  q?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUserOrThrow();
  const params = await searchParams;
  const where = {
    account: { userId: user.id },
    description: params.q
      ? {
          contains: params.q,
          mode: "insensitive" as const,
        }
      : undefined,
    bookedAt:
      params.from || params.to
        ? {
            gte: params.from ? new Date(params.from) : undefined,
            lte: params.to ? new Date(params.to) : undefined,
          }
        : undefined,
    entityId: params.entity || undefined,
  };

  const [transactions, entities, categories] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true, entity: true },
      orderBy: { bookedAt: "desc" },
      take: 120,
    }),
    prisma.entityMembership.findMany({ where: { userId: user.id }, include: { entity: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">Transactions</h2>
      <form className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search description or merchant"
          className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
        />
        <select name="entity" defaultValue={params.entity ?? ""} className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm">
          <option value="">All entities</option>
          {entities.map((item) => (
            <option key={item.entity.id} value={item.entity.id}>
              {item.entity.name}
            </option>
          ))}
        </select>
        <input name="from" defaultValue={params.from} type="date" className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" />
        <input name="to" defaultValue={params.to} type="date" className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-medium text-slate-900">
          Apply filters
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-white/10">
                <td className="px-3 py-2">{formatDateNl(tx.bookedAt)}</td>
                <td className="px-3 py-2">
                  <p className="text-white">{tx.description}</p>
                  <p className="text-xs text-slate-400">{tx.normalizedMerchant ?? "Unknown merchant"}</p>
                </td>
                <td className="px-3 py-2">{tx.entity.name}</td>
                <td className="px-3 py-2">
                  <form action={`/api/transactions/${tx.id}/category`} method="post" className="inline">
                    <select
                      name="categoryId"
                      defaultValue={tx.categoryId ?? ""}
                      className="rounded-md border border-white/15 bg-slate-950 px-2 py-1 text-xs"
                      onChange={(event) => {
                        event.currentTarget.form?.requestSubmit();
                      }}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </form>
                </td>
                <td className="px-3 py-2">{formatEuroFromCents(tx.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
