import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import type { ConnectorTokenPayload } from "@/lib/connectors/types";

export function encryptConnectorToken(payload: ConnectorTokenPayload): string {
  return encryptSecret(JSON.stringify(payload));
}

export function decryptConnectorToken(encrypted?: string | null): ConnectorTokenPayload | null {
  if (!encrypted) {
    return null;
  }
  const decrypted = decryptSecret(encrypted);
  return JSON.parse(decrypted) as ConnectorTokenPayload;
}
