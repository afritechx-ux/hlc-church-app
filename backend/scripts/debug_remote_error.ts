
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING REMOTE SCHEMA INSPECTION ---');

    try {
        // 1. List all tables
        console.log('1. Listing all tables in public schema...');
        const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `;
        console.log('   Tables found:', tables);

        // 2. Check PaymentConfig specifically
        try {
            const count1 = await prisma.$queryRaw`SELECT count(*) FROM "PaymentConfig"`;
            console.log('   "PaymentConfig" table exists. Rows:', count1);
        } catch (e) {
            console.log('   "PaymentConfig" table DOES NOT exist.');
        }

        try {
            const count2 = await prisma.$queryRaw`SELECT count(*) FROM "payment_configurations"`;
            console.log('   "payment_configurations" table exists. Rows:', count2);
        } catch (e) {
            console.log('   "payment_configurations" table DOES NOT exist.');
        }

    } catch (error) {
        console.error('GLOBAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- DEBUG COMPLETE ---');
    }
}

main();
