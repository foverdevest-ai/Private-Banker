import type { AccountConnection, Account as PrismaAccount } from "@prisma/client";
import { ConnectorConfigError } from "@/lib/connectors/errors";
import { abnAmroConnector } from "@/lib/connectors/providers/abn-amro";
import { icsConnector } from "@/lib/connectors/providers/ics";
import { paypalConnector } from "@/lib/connectors/providers/paypal";
import { bitvavoConnector } from "@/lib/connectors/providers/bitvavo";
import { decryptConnectorToken } from "@/lib/connectors/token-store";
import type { AccountConnector, ConnectorProviderKey, ConnectorSyncResult } from "@/lib/connectors/types";

const mockConnector: AccountConnector = {
  key: "MOCK",
  async sync({ accountExternalId }) {
    const now = new Date();
    return {
      status: "PARTIAL",
      transactions: [
        {
          externalId: `MOCK-${accountExternalId}-${now.getTime()}`,
          bookedAt: now.toISOString(),
          amountCents: -1299,
          currency: "EUR",
          description: "MOCK imported transaction",
          merchant: "Spotify",
        },
      ],
      summary: "Mocked sync executed. Manual fallback remains available.",
      rawPayload: { mock: true },
    };
  },
};

const manualConnector: AccountConnector = {
  key: "MANUAL",
  async sync() {
    return {
      status: "PARTIAL",
      transactions: [],
      summary: "Manual provider selected. No automatic sync performed.",
      rawPayload: { manual: true },
    };
  },
};

export const connectors: Record<ConnectorProviderKey, AccountConnector> = {
  ABN_AMRO: abnAmroConnector,
  ICS: icsConnector,
  PAYPAL: paypalConnector,
  BITVAVO: bitvavoConnector,
  MANUAL: manualConnector,
  MOCK: mockConnector,
};

export function getConnector(provider: ConnectorProviderKey) {
  return connectors[provider] ?? connectors.MOCK;
}

export async function syncConnectedAccount(input: {
  provider: ConnectorProviderKey;
  account: PrismaAccount;
  connection: AccountConnection | null;
}): Promise<ConnectorSyncResult> {
  const connector = getConnector(input.provider);
  const token = decryptConnectorToken(input.connection?.encryptedToken);
  const externalId = input.connection?.externalAccountId ?? input.account.id;

  try {
    return await connector.sync({
      accountExternalId: externalId,
      token: token ?? undefined,
    });
  } catch (error) {
    if (error instanceof ConnectorConfigError) {
      return {
        status: "FAILED",
        transactions: [],
        summary: error.message,
        rawPayload: {
          provider: input.provider,
          error: error.message,
        },
      };
    }
    throw error;
  }
}
