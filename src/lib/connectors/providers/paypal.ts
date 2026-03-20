import { env } from "@/lib/env";
import { ConnectorConfigError } from "@/lib/connectors/errors";
import { fetchJson } from "@/lib/connectors/http";
import type { AccountConnector, ConnectorTokenPayload } from "@/lib/connectors/types";

function ensureConfigured() {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new ConnectorConfigError("PayPal credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }
}

function basicAuth() {
  return Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
}

export const paypalConnector: AccountConnector = {
  key: "PAYPAL",
  getAuthorizationUrl(state: string) {
    ensureConfigured();
    const redirectUri = `${env.CONNECTOR_REDIRECT_BASE_URL}/api/connect/callback`;
    const params = new URLSearchParams({
      flowEntry: "static",
      client_id: env.PAYPAL_CLIENT_ID!,
      response_type: "code",
      scope: "openid profile email",
      redirect_uri: redirectUri,
      state,
    });
    return `${env.PAYPAL_AUTH_URL}?${params.toString()}`;
  },
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<ConnectorTokenPayload> {
    ensureConfigured();
    const token = await fetchJson<{
      access_token: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
      refresh_token?: string;
    }>(env.PAYPAL_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth()}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
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
      throw new ConnectorConfigError("PayPal connection is not authorized. Connect the account first.");
    }
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 2);
    const params = new URLSearchParams({
      start_date: start.toISOString(),
      end_date: now.toISOString(),
      fields: "all",
      page_size: "100",
    });
    const payload = await fetchJson<{
      transaction_details?: Array<{
        transaction_info?: {
          transaction_id?: string;
          transaction_initiation_date?: string;
          transaction_amount?: {
            value?: string;
            currency_code?: string;
          };
          transaction_note?: string;
        };
        payer_info?: {
          payer_name?: {
            alternate_full_name?: string;
          };
        };
      }>;
    }>(`${env.PAYPAL_API_BASE_URL}/v1/reporting/transactions?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const transactions = (payload.transaction_details ?? []).map((row) => {
      const value = Number(row.transaction_info?.transaction_amount?.value ?? "0");
      return {
        externalId: row.transaction_info?.transaction_id ?? `${accountExternalId}-${row.transaction_info?.transaction_initiation_date}-${value}`,
        bookedAt: row.transaction_info?.transaction_initiation_date ?? now.toISOString(),
        amountCents: Math.round(value * 100),
        currency: row.transaction_info?.transaction_amount?.currency_code ?? "EUR",
        description: row.transaction_info?.transaction_note ?? "PayPal transaction",
        merchant: row.payer_info?.payer_name?.alternate_full_name ?? "PayPal",
      };
    });

    return {
      status: "SUCCESS" as const,
      transactions,
      summary: `PayPal sync completed (${transactions.length} transactions).`,
      rawPayload: payload,
    };
  },
};
