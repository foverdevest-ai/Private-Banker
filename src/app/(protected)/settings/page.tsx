import { auth, getCurrentUserOrThrow } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getConnectorReadiness, getCoreReadiness } from "@/lib/connectors/readiness";

export default async function SettingsPage() {
  const session = await auth();
  const user = await getCurrentUserOrThrow();
  const core = getCoreReadiness();
  const providers = getConnectorReadiness();

  const connections = await prisma.accountConnection.findMany({
    where: { account: { userId: user.id } },
    include: { account: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Settings & Integrations</h2>
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
        <p>Signed in as: {session?.user?.email ?? env.APP_DEMO_EMAIL}</p>
        <p className="mt-2">Allowed emails are configured via `ALLOWED_EMAILS`.</p>
        <p>Google OAuth credentials are configured via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.</p>
        <p>AI provider base URL is configured by `OPENAI_API_BASE_URL` and model by `OPENAI_MODEL`.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
        <p className="font-medium text-white">Core readiness</p>
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400">{core.configured ? "Ready" : "Action needed"}</p>
        <div className="mt-2 space-y-1">
          {core.checks.map((item) => (
            <p key={item.key} className={item.isSet ? "text-emerald-300" : "text-rose-300"}>
              {item.isSet ? "OK" : "MISSING"} - {item.key}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
        <p className="font-medium text-white">Connector readiness</p>
        <div className="mt-3 space-y-2">
          {providers.map((provider) => (
            <div key={provider.provider} className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
              <p className="text-white">
                {provider.provider} - {provider.configured ? "Configured" : "Missing configuration"}
              </p>
              {provider.requirements.length > 0 ? (
                <p className="mt-1 text-xs text-slate-400">
                  {provider.requirements.map((req) => `${req.key}:${req.isSet ? "ok" : "missing"}`).join(" | ")}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">{provider.notes.join(" ")}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200">
        <p className="font-medium text-white">Current account connections</p>
        <div className="mt-2 space-y-2">
          {connections.length === 0 ? <p className="text-slate-400">No account connections yet.</p> : null}
          {connections.map((connection) => (
            <div key={connection.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs">
              <p className="text-white">
                {connection.account.name} - {connection.provider}
              </p>
              <p className="text-slate-400">
                status: {connection.status} | token: {connection.encryptedToken ? "stored" : "missing"} | last sync:{" "}
                {connection.lastSyncAt ? connection.lastSyncAt.toISOString().slice(0, 19).replace("T", " ") : "never"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
