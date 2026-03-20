import { NextResponse } from "next/server";
import type { ConnectionProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseConnectState } from "@/lib/connectors/oauth-state";
import { getConnector } from "@/lib/connectors";
import { encryptConnectorToken } from "@/lib/connectors/token-store";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/accounts?connectError=${encodeURIComponent(error)}`, request.url));
  }
  if (!state || !code) {
    return NextResponse.redirect(new URL("/accounts?connectError=missing_code_or_state", request.url));
  }

  try {
    const payload = parseConnectState(state);
    const provider = payload.provider as ConnectionProvider;
    const connector = getConnector(provider);
    if (!connector.exchangeCodeForToken) {
      throw new Error(`${provider} does not support code exchange`);
    }

    const redirectUri = `${env.CONNECTOR_REDIRECT_BASE_URL}/api/connect/callback`;
    const token = await connector.exchangeCodeForToken(code, redirectUri);

    const account = await prisma.account.findFirst({
      where: {
        id: payload.accountId,
        userId: payload.userId,
      },
      include: { connection: true },
    });
    if (!account?.connection) {
      throw new Error("Connection record not found");
    }

    await prisma.accountConnection.update({
      where: { id: account.connection.id },
      data: {
        provider,
        encryptedToken: encryptConnectorToken(token),
        status: "connected",
      },
    });

    return NextResponse.redirect(new URL("/accounts?connectSuccess=1", request.url));
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "connect_failed";
    return NextResponse.redirect(new URL(`/accounts?connectError=${encodeURIComponent(message)}`, request.url));
  }
}
