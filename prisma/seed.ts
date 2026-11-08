import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SHIPPING_RATES = [
  { dayOfWeek: 0, cost: 7 },
  { dayOfWeek: 1, cost: 5 },
  { dayOfWeek: 2, cost: 5 },
  { dayOfWeek: 3, cost: 5 },
  { dayOfWeek: 4, cost: 5 },
  { dayOfWeek: 5, cost: 6 },
  { dayOfWeek: 6, cost: 7 },
];

async function main() {
  for (const rate of SHIPPING_RATES) {
    await prisma.shippingRate.upsert({
      where: { dayOfWeek: rate.dayOfWeek },
      update: { cost: rate.cost },
      create: rate,
    });
  }
  console.log(`Tarifas de envío cargadas: ${SHIPPING_RATES.length}`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
