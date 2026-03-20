import type { AccountConnector, ConnectorSyncResult } from "@/lib/connectors/types";

async function mockedSync(provider: string, accountExternalId: string): Promise<ConnectorSyncResult> {
  const now = new Date();
  return {
    status: "PARTIAL",
    transactions: [
      {
        externalId: `${provider}-${accountExternalId}-${now.getTime()}`,
        bookedAt: now.toISOString(),
        amountCents: -1299,
        currency: "EUR",
        description: `${provider} imported transaction`,
        merchant: "Spotify",
      },
    ],
    summary: `${provider} sync executed via mocked/dev adapter. Manual fallback remains enabled.`,
    rawPayload: {
      provider,
      accountExternalId,
      mock: true,
    },
  };
}

function makeConnector(key: AccountConnector["key"]): AccountConnector {
  return {
    key,
    async sync(accountExternalId: string) {
      return mockedSync(key, accountExternalId);
    },
  };
}

export const connectors: Record<AccountConnector["key"], AccountConnector> = {
  ABN_AMRO: makeConnector("ABN_AMRO"),
  ICS: makeConnector("ICS"),
  PAYPAL: makeConnector("PAYPAL"),
  BITVAVO: makeConnector("BITVAVO"),
  MANUAL: makeConnector("MANUAL"),
  MOCK: makeConnector("MOCK"),
};
