export type SyncTransaction = {
  externalId: string;
  bookedAt: string;
  amountCents: number;
  currency: string;
  description: string;
  merchant: string;
};

export type ConnectorSyncResult = {
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  transactions: SyncTransaction[];
  summary: string;
  rawPayload: unknown;
};

export type ConnectorProviderKey = "ABN_AMRO" | "ICS" | "PAYPAL" | "BITVAVO" | "MANUAL" | "MOCK";

export type ConnectorTokenPayload = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
};

export interface AccountConnector {
  key: ConnectorProviderKey;
  getAuthorizationUrl?(state: string): string;
  exchangeCodeForToken?(code: string, redirectUri: string): Promise<ConnectorTokenPayload>;
  sync(input: {
    accountExternalId: string;
    token?: ConnectorTokenPayload;
  }): Promise<ConnectorSyncResult>;
}
