import { env } from "@/lib/env";
import { ConnectorConfigError } from "@/lib/connectors/errors";
import { fetchJson } from "@/lib/connectors/http";
import type { AccountConnector, ConnectorTokenPayload } from "@/lib/connectors/types";

function ensureConfigured() {
  if (!env.ABN_AMRO_CLIENT_ID || !env.ABN_AMRO_CLIENT_SECRET) {
    throw new ConnectorConfigError("ABN AMRO credentials are missing. Set ABN_AMRO_CLIENT_ID and ABN_AMRO_CLIENT_SECRET.");
  }
}

export const abnAmroConnector: AccountConnector = {
  key: "ABN_AMRO",
  getAuthorizationUrl(state: string) {
    ensureConfigured();
    const redirectUri = `${env.CONNECTOR_REDIRECT_BASE_URL}/api/connect/callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.ABN_AMRO_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "ais:transactions:read ais:balance:read",
      state,
    });
    return `${env.ABN_AMRO_AUTH_URL}?${params.toString()}`;
  },
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<ConnectorTokenPayload> {
    ensureConfigured();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.ABN_AMRO_CLIENT_ID!,
      client_secret: env.ABN_AMRO_CLIENT_SECRET!,
    });
    const token = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    }>(env.ABN_AMRO_TOKEN_URL, {
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
    if (!token?.accessToken) {
      throw new ConnectorConfigError("ABN AMRO connection is not authorized. Connect the account first.");
    }

    const endpoint = `${env.ABN_AMRO_API_BASE_URL}/v1/accounts/${encodeURIComponent(accountExternalId)}/transactions`;
    const payload = await fetchJson<{
      transactions?: Array<{
        transactionId?: string;
        bookingDate?: string;
        amount?: number;
        currency?: string;
        description?: string;
        counterpartyName?: string;
      }>;
    }>(endpoint, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json",
      },
    });

    const transactions = (payload.transactions ?? []).map((row) => ({
      externalId: row.transactionId ?? `${accountExternalId}-${row.bookingDate}-${row.amount}`,
      bookedAt: row.bookingDate ?? new Date().toISOString(),
      amountCents: Math.round((row.amount ?? 0) * 100),
      currency: row.currency ?? "EUR",
      description: row.description ?? "ABN AMRO transaction",
      merchant: row.counterpartyName ?? "Unknown",
    }));

    return {
      status: "SUCCESS" as const,
      transactions,
      summary: `ABN AMRO sync completed (${transactions.length} transactions).`,
      rawPayload: payload,
    };
  },
};
