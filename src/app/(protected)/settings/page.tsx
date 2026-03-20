import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function SettingsPage() {
  const session = await auth();
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
        <p className="font-medium text-white">Connector status</p>
        <p className="mt-2">ABN AMRO direct integration architecture is in place with mocked dev adapter and manual fallback.</p>
        <p>ICS, PayPal, and Bitvavo follow the same provider abstraction.</p>
      </div>
    </div>
  );
}
