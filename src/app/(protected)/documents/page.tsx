import Link from "next/link";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateNl } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage() {
  const user = await getCurrentUserOrThrow();
  const docs = await prisma.document.findMany({
    where: { userId: user.id },
    include: { extractedFields: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Documents</h2>
      <form action="/api/documents/upload" method="post" encType="multipart/form-data" className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-sm text-slate-300">Upload mortgage and financial PDF documents for extraction and Q&A.</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          <input name="file" required type="file" accept=".pdf,application/pdf" className="rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm" />
          <Button type="submit">Upload and index</Button>
        </div>
      </form>

      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">{doc.title}</p>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                  {doc.status} · {formatDateNl(doc.createdAt)}
                </p>
              </div>
              <Link href={`/documents/${doc.id}`} className="text-sm text-emerald-300 hover:text-emerald-200">
                Open
              </Link>
            </div>
            <div className="mt-2 text-xs text-slate-300">
              {doc.extractedFields.slice(0, 4).map((field) => `${field.fieldName}: ${field.value ?? "unknown"} (${field.valueKind})`).join(" · ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
