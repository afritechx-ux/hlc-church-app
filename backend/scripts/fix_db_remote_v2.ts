import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING REMOTE DB SCHEMA ---');
    try {
        // 1. Add 'goal' column to GivingFund
        console.log('1. Adding "goal" column to GivingFund...');
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "GivingFund" ADD COLUMN "goal" DECIMAL(65,30);`);
            console.log('   SUCCESS: Added "goal" column.');
        } catch (e) {
            console.log('   Note: "goal" column might already exist or error:', e.message);
        }

        // 2. Rename payment_configurations BACK to PaymentConfig
        // (The debug script passed an error saying "public.PaymentConfig does not exist", implying the client wants PaymentConfig)
        console.log('2. Renaming "payment_configurations" BACK to "PaymentConfig"...');
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "payment_configurations" RENAME TO "PaymentConfig";`);
            console.log('   SUCCESS: Renamed table back to "PaymentConfig".');
        } catch (e) {
            console.log('   Note: might already be named PaymentConfig or error:', e.message);
        }

    } catch (e) {
        console.error('GLOBAL ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
