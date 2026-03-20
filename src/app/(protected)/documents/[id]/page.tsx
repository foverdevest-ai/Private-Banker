import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUserOrThrow();
  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: { chunks: true, extractedFields: true },
  });
  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">{document.title}</h2>
      <p className="text-sm text-slate-300">Status: {document.status}</p>
      <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Extracted fields</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {document.extractedFields.map((field) => (
            <div key={field.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-2 text-sm">
              <p className="text-white">{field.fieldName}</p>
              <p className="text-slate-300">
                {field.value ?? "Not found"} ({field.valueKind})
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Ask this document</p>
        <form action={`/api/documents/${document.id}/ask`} method="post" className="mt-3 flex gap-2">
          <input
            name="question"
            required
            defaultValue="Summarize key mortgage terms and call out unknown values."
            className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-emerald-400 px-4 text-sm font-medium text-slate-900">
            Ask
          </button>
        </form>
      </section>
      <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Chunks</p>
        <div className="mt-2 space-y-2">
          {document.chunks.map((chunk) => (
            <div key={chunk.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-sm text-slate-200">
              <p className="mb-1 text-xs text-slate-400">Chunk #{chunk.chunkIndex}</p>
              <p>{chunk.content.slice(0, 700)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
