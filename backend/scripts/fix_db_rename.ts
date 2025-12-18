import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RENAMING TABLE PaymentConfig -> payment_configurations ---');
    try {
        // 1. Rename the table
        await prisma.$executeRawUnsafe(`ALTER TABLE "PaymentConfig" RENAME TO "payment_configurations";`);
        console.log('SUCCESS: Renamed table "PaymentConfig" to "payment_configurations".');
    } catch (e) {
        console.error('ERROR renaming table:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
