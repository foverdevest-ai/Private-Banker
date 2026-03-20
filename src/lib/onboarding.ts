import { prisma } from "@/lib/prisma";

export async function bootstrapUserIfEmpty(userId: string) {
  const accountCount = await prisma.account.count({ where: { userId } });
  if (accountCount > 0) {
    return false;
  }

  const existingMemberships = await prisma.entityMembership.count({ where: { userId } });
  if (existingMemberships > 0) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    const personal = await tx.entity.create({
      data: {
        name: "Personal",
        type: "PERSONAL",
      },
    });
    const holding = await tx.entity.create({
      data: {
        name: "Holding",
        type: "HOLDING",
      },
    });

    await tx.entityMembership.createMany({
      data: [
        { userId, entityId: personal.id, role: "OWNER" },
        { userId, entityId: holding.id, role: "OWNER" },
      ],
    });

    await tx.account.create({
      data: {
        userId,
        entityId: personal.id,
        name: "ABN AMRO Main",
        kind: "BANK",
        currency: "EUR",
        currentBalanceCents: 0n,
        source: "MANUAL",
        connection: {
          create: {
            provider: "ABN_AMRO",
            status: "pending",
          },
        },
      },
    });

    await tx.account.create({
      data: {
        userId,
        entityId: holding.id,
        name: "Holding Cash",
        kind: "BANK",
        currency: "EUR",
        currentBalanceCents: 0n,
        source: "MANUAL",
        connection: {
          create: {
            provider: "MANUAL",
            status: "manual",
          },
        },
      },
    });
  });

  return true;
}
