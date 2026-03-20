import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { getConnectorReadiness, getCoreReadiness } from "../src/lib/connectors/readiness";
import { env } from "../src/lib/env";

async function checkDatabase() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: "Database reachable" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Database not reachable" };
  } finally {
    await prisma.$disconnect();
  }
}

function printRow(label: string, ok: boolean, detail: string) {
  const state = ok ? "OK" : "FAIL";
  console.log(`${state}  ${label} - ${detail}`);
}

async function main() {
  console.log("Private Banker Dashboard preflight");
  console.log(`Mode: ${env.NODE_ENV}`);
  console.log(`Redirect base: ${env.CONNECTOR_REDIRECT_BASE_URL}`);
  console.log("");

  const core = getCoreReadiness();
  core.checks.forEach((item) => printRow(item.key, item.isSet, item.isSet ? "configured" : "missing"));

  console.log("");
  const db = await checkDatabase();
  printRow("DATABASE_CONNECTIVITY", db.ok, db.message);

  console.log("");
  for (const provider of getConnectorReadiness()) {
    printRow(`CONNECTOR_${provider.provider}`, provider.configured, provider.configured ? "configured" : "missing environment values");
    for (const requirement of provider.requirements) {
      printRow(`  ${requirement.key}`, requirement.isSet, requirement.isSet ? "configured" : "missing");
    }
  }

  const failed = !core.configured || !db.ok;
  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
