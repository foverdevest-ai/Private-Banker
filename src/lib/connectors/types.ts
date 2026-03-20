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

export interface AccountConnector {
  key: "ABN_AMRO" | "ICS" | "PAYPAL" | "BITVAVO" | "MANUAL" | "MOCK";
  sync(accountExternalId: string): Promise<ConnectorSyncResult>;
}
