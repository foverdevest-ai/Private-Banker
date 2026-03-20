import { NextResponse } from "next/server";
import type { ConnectionProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { createConnectState } from "@/lib/connectors/oauth-state";
import { getConnector } from "@/lib/connectors";

const OAUTH_PROVIDERS = new Set<ConnectionProvider>(["ABN_AMRO", "ICS", "PAYPAL"]);

export async function POST(request: Request) {
  const user = await getCurrentUserOrThrow();
  const body = await request.formData();
  const accountId = String(body.get("accountId") ?? "");
  const provider = String(body.get("provider") ?? "") as ConnectionProvider;

  if (!accountId || !provider) {
    return NextResponse.json({ error: "accountId and provider are required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    include: { connection: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const connection =
    account.connection ??
    (await prisma.accountConnection.create({
      data: {
        accountId: account.id,
        provider,
        status: "pending",
      },
    }));

  if (!account.connection || account.connection.provider !== provider) {
    await prisma.accountConnection.update({
      where: { id: connection.id },
      data: {
        provider,
        status: "pending",
      },
    });
  }

  if (!OAUTH_PROVIDERS.has(provider)) {
    await prisma.accountConnection.update({
      where: { id: connection.id },
      data: {
        status: "connected",
      },
    });
    return NextResponse.redirect(new URL("/accounts", request.url));
  }

  const connector = getConnector(provider);
  if (!connector.getAuthorizationUrl) {
    return NextResponse.json({ error: `${provider} does not support OAuth connect flow` }, { status: 400 });
  }

  const state = createConnectState({
    userId: user.id,
    accountId: account.id,
    provider,
  });

  const authUrl = connector.getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
