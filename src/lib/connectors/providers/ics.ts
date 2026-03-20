import { env } from "@/lib/env";
import { ConnectorConfigError } from "@/lib/connectors/errors";
import { fetchJson } from "@/lib/connectors/http";
import type { AccountConnector, ConnectorTokenPayload } from "@/lib/connectors/types";

function ensureConfigured() {
  if (!env.ICS_CLIENT_ID || !env.ICS_CLIENT_SECRET || !env.ICS_AUTH_URL || !env.ICS_TOKEN_URL || !env.ICS_API_BASE_URL) {
    throw new ConnectorConfigError(
      "ICS connector is not fully configured. Set ICS_CLIENT_ID, ICS_CLIENT_SECRET, ICS_AUTH_URL, ICS_TOKEN_URL, and ICS_API_BASE_URL.",
    );
  }
}

export const icsConnector: AccountConnector = {
  key: "ICS",
  getAuthorizationUrl(state: string) {
    ensureConfigured();
    const redirectUri = `${env.CONNECTOR_REDIRECT_BASE_URL}/api/connect/callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.ICS_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "transactions.read",
      state,
    });
    return `${env.ICS_AUTH_URL}?${params.toString()}`;
  },
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<ConnectorTokenPayload> {
    ensureConfigured();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.ICS_CLIENT_ID!,
      client_secret: env.ICS_CLIENT_SECRET!,
    });
    const token = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    }>(env.ICS_TOKEN_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_in ? Date.now() + token.expires_in * 1000 : undefined,
      tokenType: token.token_type,
      scope: token.scope,
    };
  },
  async sync({ accountExternalId, token }) {
    ensureConfigured();
    if (!token?.accessToken) {
      throw new ConnectorConfigError("ICS connection is not authorized. Connect the account first.");
    }
    const payload = await fetchJson<{
      transactions?: Array<{
        id?: string;
        booked_at?: string;
        amount?: number;
        currency?: string;
        description?: string;
        merchant?: string;
      }>;
    }>(`${env.ICS_API_BASE_URL}/accounts/${encodeURIComponent(accountExternalId)}/transactions`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const transactions = (payload.transactions ?? []).map((row) => ({
      externalId: row.id ?? `${accountExternalId}-${row.booked_at}-${row.amount}`,
      bookedAt: row.booked_at ?? new Date().toISOString(),
      amountCents: Math.round((row.amount ?? 0) * 100),
      currency: row.currency ?? "EUR",
      description: row.description ?? "ICS card transaction",
      merchant: row.merchant ?? "Unknown",
    }));

    return {
      status: "SUCCESS" as const,
      transactions,
      summary: `ICS sync completed (${transactions.length} transactions).`,
      rawPayload: payload,
    };
  },
};
