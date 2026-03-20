import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { detectSubscriptions } from "../src/lib/finance/subscriptions";

const prisma = new PrismaClient();

function hashDedupe(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

async function main() {
  const demoEmail = process.env.APP_DEMO_EMAIL ?? "demo@privatebanker.local";

  await prisma.citation.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.mortgageSnapshot.deleteMany();
  await prisma.mortgage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.liabilityValuation.deleteMany();
  await prisma.liability.deleteMany();
  await prisma.assetValuation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.subscriptionCandidate.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.category.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.accountConnection.deleteMany();
  await prisma.accountBalanceHistory.deleteMany();
  await prisma.account.deleteMany();
  await prisma.netWorthSnapshot.deleteMany();
  await prisma.taxInsightSnapshot.deleteMany();
  await prisma.taxYearConfig.deleteMany();
  await prisma.entityMembership.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: demoEmail,
      name: "Demo Client",
    },
  });

  const personal = await prisma.entity.create({
    data: {
      name: "Personal",
      type: "PERSONAL",
    },
  });
  const holding = await prisma.entity.create({
    data: {
      name: "Holding",
      type: "HOLDING",
    },
  });

  await prisma.entityMembership.createMany({
    data: [
      { userId: user.id, entityId: personal.id, role: "OWNER" },
      { userId: user.id, entityId: holding.id, role: "OWNER" },
    ],
  });

  const categories = await prisma.category.createManyAndReturn({
    data: [
      { name: "Housing", colorHex: "#38bdf8", isSystem: true },
      { name: "Groceries", colorHex: "#22c55e", isSystem: true },
      { name: "Transport", colorHex: "#f59e0b", isSystem: true },
      { name: "Subscriptions", colorHex: "#f43f5e", isSystem: true },
      { name: "Income", colorHex: "#34d399", isSystem: true },
      { name: "Utilities", colorHex: "#a78bfa", isSystem: true },
    ],
  });
  const categoryByName = new Map(categories.map((item) => [item.name, item.id]));

  const merchants = await prisma.merchant.createManyAndReturn({
    data: [
      { rawName: "ALBERT HEIJN", normalizedName: "Albert Heijn" },
      { rawName: "SPOTIFY", normalizedName: "Spotify" },
      { rawName: "NS", normalizedName: "Nederlandse Spoorwegen" },
      { rawName: "EMPLOYER BV", normalizedName: "Employer BV" },
      { rawName: "ABN AMRO HYPOTHEEK", normalizedName: "ABN AMRO Hypotheek" },
    ],
  });
  const merchantByName = new Map(merchants.map((item) => [item.normalizedName, item.id]));

  const personalChecking = await prisma.account.create({
    data: {
      userId: user.id,
      entityId: personal.id,
      name: "ABN AMRO Checking",
      kind: "BANK",
      iban: "NL91ABNA0417164300",
      currentBalanceCents: 126_450_00n,
      source: "IMPORTED",
      connection: {
        create: {
          provider: "ABN_AMRO",
          externalAccountId: "abn-personal-001",
          status: "connected",
        },
      },
    },
  });
  const holdingCash = await prisma.account.create({
    data: {
      userId: user.id,
      entityId: holding.id,
      name: "Holding Cash Account",
      kind: "BANK",
      currentBalanceCents: 82_000_00n,
      source: "MANUAL",
      connection: {
        create: {
          provider: "MANUAL",
          status: "manual",
        },
      },
    },
  });

  await prisma.accountBalanceHistory.createMany({
    data: [
      { accountId: personalChecking.id, balanceCents: 115_300_00n, effectiveDate: new Date("2026-01-31"), source: "IMPORTED" },
      { accountId: personalChecking.id, balanceCents: 121_800_00n, effectiveDate: new Date("2026-02-28"), source: "IMPORTED" },
      { accountId: personalChecking.id, balanceCents: 126_450_00n, effectiveDate: new Date("2026-03-15"), source: "IMPORTED" },
      { accountId: holdingCash.id, balanceCents: 80_000_00n, effectiveDate: new Date("2026-01-31"), source: "MANUAL" },
      { accountId: holdingCash.id, balanceCents: 81_300_00n, effectiveDate: new Date("2026-02-28"), source: "MANUAL" },
      { accountId: holdingCash.id, balanceCents: 82_000_00n, effectiveDate: new Date("2026-03-15"), source: "MANUAL" },
    ],
  });

  const txTemplate = [
    { date: "2026-01-25", amount: -9450, description: "ALBERT HEIJN #341", merchant: "Albert Heijn", category: "Groceries" },
    { date: "2026-01-26", amount: -1299, description: "SPOTIFY PREMIUM", merchant: "Spotify", category: "Subscriptions" },
    { date: "2026-01-27", amount: -3300, description: "NS TREIN ABONNEMENT", merchant: "Nederlandse Spoorwegen", category: "Transport" },
    { date: "2026-01-28", amount: 320_000, description: "EMPLOYER BV SALARY", merchant: "Employer BV", category: "Income" },
    { date: "2026-02-25", amount: -10420, description: "ALBERT HEIJN #884", merchant: "Albert Heijn", category: "Groceries" },
    { date: "2026-02-26", amount: -1299, description: "SPOTIFY PREMIUM", merchant: "Spotify", category: "Subscriptions" },
    { date: "2026-02-27", amount: -3300, description: "NS TREIN ABONNEMENT", merchant: "Nederlandse Spoorwegen", category: "Transport" },
    { date: "2026-02-28", amount: -189_000, description: "ABN AMRO HYPOTHEEK", merchant: "ABN AMRO Hypotheek", category: "Housing" },
    { date: "2026-03-01", amount: 320_000, description: "EMPLOYER BV SALARY", merchant: "Employer BV", category: "Income" },
    { date: "2026-03-02", amount: -10980, description: "ALBERT HEIJN #122", merchant: "Albert Heijn", category: "Groceries" },
    { date: "2026-03-03", amount: -1299, description: "SPOTIFY PREMIUM", merchant: "Spotify", category: "Subscriptions" },
    { date: "2026-03-07", amount: -189_000, description: "ABN AMRO HYPOTHEEK", merchant: "ABN AMRO Hypotheek", category: "Housing" },
  ];

  await prisma.transaction.createMany({
    data: txTemplate.map((item) => ({
      accountId: personalChecking.id,
      entityId: personal.id,
      merchantId: merchantByName.get(item.merchant),
      categoryId: categoryByName.get(item.category),
      bookedAt: new Date(item.date),
      amountCents: BigInt(item.amount),
      currency: "EUR",
      direction: item.amount < 0 ? "DEBIT" : "CREDIT",
      description: item.description,
      normalizedMerchant: item.merchant.toLowerCase(),
      externalTransactionId: `seed-${item.date}-${item.description}`,
      dedupeHash: hashDedupe(`${item.date}:${item.description}:${item.amount}`),
      source: "IMPORTED",
      rawPayload: {
        seed: true,
      },
    })),
  });

  const houseAsset = await prisma.asset.create({
    data: {
      entityId: personal.id,
      type: "PROPERTY",
      name: "Amsterdam House",
      source: "MANUAL",
      property: {
        create: {
          address: "Keizersgracht 123, Amsterdam",
          latestWozValueCents: 785_000_00n,
          latestWozYear: 2026,
        },
      },
    },
    include: { property: true },
  });
  await prisma.assetValuation.createMany({
    data: [
      { assetId: houseAsset.id, valueCents: 760_000_00n, effectiveDate: new Date("2026-01-01"), source: "MANUAL", sourceLabel: "manual valuation" },
      { assetId: houseAsset.id, valueCents: 772_000_00n, effectiveDate: new Date("2026-02-01"), source: "MANUAL", sourceLabel: "manual valuation" },
      { assetId: houseAsset.id, valueCents: 785_000_00n, effectiveDate: new Date("2026-03-01"), source: "MANUAL", sourceLabel: "WOZ 2026" },
    ],
  });

  const businessAsset = await prisma.asset.create({
    data: {
      entityId: holding.id,
      type: "BUSINESS",
      name: "Holding Business Value",
      source: "MANUAL",
    },
  });
  await prisma.assetValuation.createMany({
    data: [
      { assetId: businessAsset.id, valueCents: 210_000_00n, effectiveDate: new Date("2026-01-01"), source: "MANUAL", sourceLabel: "owner estimate" },
      { assetId: businessAsset.id, valueCents: 218_000_00n, effectiveDate: new Date("2026-03-01"), source: "MANUAL", sourceLabel: "owner estimate" },
    ],
  });

  const mortgageLiability = await prisma.liability.create({
    data: {
      entityId: personal.id,
      type: "MORTGAGE",
      name: "Home Mortgage",
      source: "IMPORTED",
      mortgage: {
        create: {
          propertyId: houseAsset.property?.id,
          lender: "ABN AMRO",
          interestRatePct: 3.12,
          termMonths: 360,
          startDate: new Date("2023-06-01"),
          originalAmountCents: 420_000_00n,
          monthlyPaymentCents: 189_000n,
          currentBalanceCents: 388_400_00n,
        },
      },
    },
    include: { mortgage: true },
  });
  await prisma.liabilityValuation.createMany({
    data: [
      { liabilityId: mortgageLiability.id, valueCents: 392_200_00n, effectiveDate: new Date("2026-01-01"), source: "IMPORTED", sourceLabel: "bank statement" },
      { liabilityId: mortgageLiability.id, valueCents: 390_300_00n, effectiveDate: new Date("2026-02-01"), source: "IMPORTED", sourceLabel: "bank statement" },
      { liabilityId: mortgageLiability.id, valueCents: 388_400_00n, effectiveDate: new Date("2026-03-01"), source: "MANUAL", sourceLabel: "manual correction" },
    ],
  });
  await prisma.mortgageSnapshot.createMany({
    data: [
      { mortgageId: mortgageLiability.mortgage!.id, balanceCents: 392_200_00n, monthlyPaymentCents: 189_000n, source: "IMPORTED", effectiveDate: new Date("2026-01-01") },
      { mortgageId: mortgageLiability.mortgage!.id, balanceCents: 390_300_00n, monthlyPaymentCents: 189_000n, source: "IMPORTED", effectiveDate: new Date("2026-02-01") },
      { mortgageId: mortgageLiability.mortgage!.id, balanceCents: 388_400_00n, monthlyPaymentCents: 189_000n, source: "MANUAL", effectiveDate: new Date("2026-03-01") },
    ],
  });

  await prisma.netWorthSnapshot.createMany({
    data: [
      { entityId: personal.id, date: new Date("2026-01-31"), totalAssetsCents: 887_000_00n, totalLiabilitiesCents: 392_200_00n, netWorthCents: 494_800_00n, source: "CALCULATED" },
      { entityId: personal.id, date: new Date("2026-02-28"), totalAssetsCents: 899_000_00n, totalLiabilitiesCents: 390_300_00n, netWorthCents: 508_700_00n, source: "CALCULATED" },
      { entityId: personal.id, date: new Date("2026-03-15"), totalAssetsCents: 911_450_00n, totalLiabilitiesCents: 388_400_00n, netWorthCents: 523_050_00n, source: "CALCULATED" },
      { entityId: holding.id, date: new Date("2026-01-31"), totalAssetsCents: 290_000_00n, totalLiabilitiesCents: 0n, netWorthCents: 290_000_00n, source: "CALCULATED" },
      { entityId: holding.id, date: new Date("2026-02-28"), totalAssetsCents: 296_000_00n, totalLiabilitiesCents: 0n, netWorthCents: 296_000_00n, source: "CALCULATED" },
      { entityId: holding.id, date: new Date("2026-03-15"), totalAssetsCents: 300_000_00n, totalLiabilitiesCents: 0n, netWorthCents: 300_000_00n, source: "CALCULATED" },
    ],
  });

  const seedSubscriptions = detectSubscriptions(
    txTemplate.map((item) => ({
      merchant: item.merchant,
      bookedAt: new Date(item.date),
      amountCents: BigInt(item.amount),
      direction: item.amount < 0 ? "DEBIT" : "CREDIT",
    })),
  );
  await prisma.subscriptionCandidate.createMany({
    data: seedSubscriptions.map((item) => ({
      entityId: personal.id,
      merchantName: item.merchantName,
      cadenceDays: item.cadenceDays,
      averageAmountCents: item.averageAmountCents,
      confidence: item.confidence,
      firstSeenAt: item.firstSeenAt,
      lastSeenAt: item.lastSeenAt,
      rationale: item.rationale,
      status: "PENDING",
    })),
  });

  await prisma.taxYearConfig.create({
    data: {
      year: 2026,
      box3ExemptionCents: 57_000_00n,
      box3RatePct: 0.36,
      mortgageInterestCapPct: 36.97,
      assumptions: {
        source: "seed-config",
        note: "Educational estimate only.",
      },
    },
  });
  await prisma.taxInsightSnapshot.create({
    data: {
      entityId: personal.id,
      year: 2026,
      estimatedBox3BaseCents: 436_050_00n,
      estimatedBox3TaxCents: 1_569_78n,
      estimatedMortgageInterestCents: 11_793_60n,
      assumptions: {
        mortgageRate: 3.12,
        note: "Approximation for educational use.",
      },
    },
  });

  await prisma.chatConversation.create({
    data: {
      userId: user.id,
      title: "Demo finance Q&A",
      messages: {
        create: [
          { role: "USER", content: "How much did I spend last month?" },
          {
            role: "ASSISTANT",
            content:
              "Data-driven facts: In the last calendar month, spending was approximately EUR 2,050. Educational explanation: this reflects debit transactions including mortgage and subscriptions. Confidence: medium, because some accounts are manual.",
            toolResult: { tool: "SPENDING" },
          },
        ],
      },
    },
  });

  console.log("Seed completed for Private Banker Dashboard");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
