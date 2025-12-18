
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING PRISMA CLIENT ACCESS TEST (APP LAYER) ---');

    try {
        // 1. Test Giving Funds
        console.log('1. Testing prisma.givingFund.findMany()...');
        try {
            const funds = await prisma.givingFund.findMany();
            console.log(`   Success! Found ${funds.length} funds.`);
            console.log('   Funds:', JSON.stringify(funds, null, 2));
        } catch (e) {
            console.error('   FAILED: prisma.givingFund.findMany()');
            console.error('   Error:', e.message);
        }

        // 2. Test Payment Configs
        console.log('2. Testing prisma.paymentConfig.findMany()...');
        try {
            const configs = await prisma.paymentConfig.findMany();
            console.log(`   Success! Found ${configs.length} configs.`);
            console.log('   Configs:', JSON.stringify(configs, null, 2));
        } catch (e) {
            console.error('   FAILED: prisma.paymentConfig.findMany()');
            console.error('   Error:', e.message);
        }

    } catch (error) {
        console.error('GLOBAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- DEBUG COMPLETE ---');
    }
}

main();
