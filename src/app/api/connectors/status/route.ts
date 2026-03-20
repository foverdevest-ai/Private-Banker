import { NextResponse } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConnectorReadiness, getCoreReadiness } from "@/lib/connectors/readiness";

export async function GET() {
  const user = await getCurrentUserOrThrow();
  const readiness = getConnectorReadiness();
  const core = getCoreReadiness();

  const connections = await prisma.accountConnection.findMany({
    where: {
      account: {
        userId: user.id,
      },
    },
    select: {
      provider: true,
      status: true,
      lastSyncAt: true,
      account: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    core,
    providers: readiness,
    connections,
  });
}
