import { createHash } from "node:crypto";
import { env } from "@/lib/env";

type ConnectStatePayload = {
  userId: string;
  accountId: string;
  provider: string;
  expiresAt: number;
};

function sign(raw: string) {
  return createHash("sha256").update(`${raw}:${env.NEXTAUTH_SECRET}`).digest("hex");
}

export function createConnectState(input: {
  userId: string;
  accountId: string;
  provider: string;
  ttlMs?: number;
}) {
  const payload: ConnectStatePayload = {
    userId: input.userId,
    accountId: input.accountId,
    provider: input.provider,
    expiresAt: Date.now() + (input.ttlMs ?? 10 * 60_000),
  };
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(raw);
  return `${raw}.${signature}`;
}

export function parseConnectState(state: string): ConnectStatePayload {
  const [raw, signature] = state.split(".");
  if (!raw || !signature || sign(raw) !== signature) {
    throw new Error("Invalid connector state signature");
  }
  const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as ConnectStatePayload;
  if (payload.expiresAt < Date.now()) {
    throw new Error("Connector state expired");
  }
  return payload;
}
