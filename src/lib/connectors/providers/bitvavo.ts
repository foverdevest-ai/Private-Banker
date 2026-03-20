import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { ConnectorConfigError } from "@/lib/connectors/errors";
import { fetchJson } from "@/lib/connectors/http";
import type { AccountConnector } from "@/lib/connectors/types";

function ensureConfigured() {
  if (!env.BITVAVO_API_KEY || !env.BITVAVO_API_SECRET) {
    throw new ConnectorConfigError("Bitvavo credentials are missing. Set BITVAVO_API_KEY and BITVAVO_API_SECRET.");
  }
}

function signedHeaders(method: string, endpointPath: string) {
  const timestamp = Date.now().toString();
  const payload = `${timestamp}${method}${endpointPath}`;
  const signature = createHmac("sha256", env.BITVAVO_API_SECRET!).update(payload).digest("hex");
  return {
    "Bitvavo-Access-Key": env.BITVAVO_API_KEY!,
    "Bitvavo-Access-Signature": signature,
    "Bitvavo-Access-Timestamp": timestamp,
    "Bitvavo-Access-Window": "10000",
  };
}

export const bitvavoConnector: AccountConnector = {
  key: "BITVAVO",
  async sync() {
    ensureConfigured();
    const path = "/account/history";
    const payload = await fetchJson<
      Array<{
        id?: string;
        timestamp?: number;
        amount?: string;
        feePaid?: string;
        market?: string;
      }>
    >(`${env.BITVAVO_API_BASE_URL}${path}`, {
      headers: {
        ...signedHeaders("GET", path),
      },
    });

    const transactions = payload.map((row) => {
      const amount = Number(row.amount ?? "0");
      const fee = Number(row.feePaid ?? "0");
      return {
        externalId: row.id ?? `${row.market}-${row.timestamp}`,
        bookedAt: new Date(row.timestamp ?? Date.now()).toISOString(),
        amountCents: Math.round((amount - fee) * 100),
        currency: "EUR",
        description: `Bitvavo ${row.market ?? "trade"}`,
        merchant: "Bitvavo",
      };
    });

    return {
      status: "SUCCESS" as const,
      transactions,
      summary: `Bitvavo sync completed (${transactions.length} entries).`,
      rawPayload: payload,
    };
  },
};
