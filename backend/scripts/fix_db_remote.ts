
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to remote DB...');

    try {
        // 1. Create Enum if not exists
        console.log('Creating PaymentMethod enum...');
        try {
            await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'ONLINE', 'BANK_TRANSFER', 'USSD', 'OTHER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        } catch (e) {
            console.log('Enum validation skipped/failed, might exist (ignoring):', e.message);
        }

        // 2. Create PaymentConfig Table
        console.log('Creating PaymentConfig table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PaymentConfig" (
                "id" TEXT NOT NULL,
                "type" "PaymentMethod" NOT NULL,
                "provider" TEXT NOT NULL,
                "accountName" TEXT NOT NULL,
                "accountNumber" TEXT NOT NULL,
                "description" TEXT,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
            );
        `);

        // Drop the wrong table if it exists
        try {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "payment_configurations";`);
            console.log('Dropped incorrect table payment_configurations');
        } catch (e) { }

        // 3. Create Chat-related enums
        console.log('Creating Chat enums...');
        try {
            await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "ChatStatus" AS ENUM ('OPEN', 'CLOSED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        } catch (e) { }

        // 4. Create Chat Table
        console.log('Creating Chat table...');
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Chat" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "userEmail" TEXT NOT NULL,
            "userName" TEXT,
            "subject" TEXT,
            "status" "ChatStatus" NOT NULL DEFAULT 'OPEN',
            "isEscalated" BOOLEAN NOT NULL DEFAULT false,
            "assignedTo" TEXT,
            "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
        );
    `);

        // Indexes for Chat
        try { await prisma.$executeRawUnsafe(`CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");`); } catch { }
        try { await prisma.$executeRawUnsafe(`CREATE INDEX "Chat_status_idx" ON "Chat"("status");`); } catch { }

        // 5. Create ChatMessage Table
        console.log('Creating ChatMessage table...');
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatMessage" (
            "id" TEXT NOT NULL,
            "chatId" TEXT NOT NULL,
            "senderId" TEXT NOT NULL,
            "senderName" TEXT NOT NULL,
            "isAdmin" BOOLEAN NOT NULL DEFAULT false,
            "content" TEXT NOT NULL,
            "attachmentUrl" TEXT,
            "attachmentType" TEXT,
            "attachmentName" TEXT,
            "readAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
        );
    `);

        // FK for ChatMessage
        try {
            await prisma.$executeRawUnsafe(`
            ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        } catch (e) { console.log('FK might exist already'); }

        // FK for ChatMessage
        try {
            await prisma.$executeRawUnsafe(`
            ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        } catch (e) { console.log('FK might exist already'); }

        // 6. Create GroupChat Related Enums
        console.log('Creating GroupChat related enums...');
        try {
            await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "GroupChatType" AS ENUM ('GROUP', 'DEPARTMENT');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        } catch (e) { }

        // 7. Create GroupChat Table
        console.log('Creating GroupChat table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "GroupChat" (
                "id" TEXT NOT NULL,
                "type" "GroupChatType" NOT NULL,
                "groupId" TEXT,
                "departmentId" TEXT,
                "name" TEXT NOT NULL,
                "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
            );
        `);

        // 8. Create GroupChatMessage Table
        console.log('Creating GroupChatMessage table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "GroupChatMessage" (
                "id" TEXT NOT NULL,
                "chatId" TEXT NOT NULL,
                "senderId" TEXT NOT NULL,
                "senderName" TEXT NOT NULL,
                "memberId" TEXT,
                "content" TEXT NOT NULL,
                "attachmentUrl" TEXT,
                "attachmentType" TEXT,
                "attachmentName" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "GroupChatMessage_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "GroupChatMessage" ADD CONSTRAINT "GroupChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "GroupChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
        } catch (e) { }

        // 9. Create DirectConversation Table
        console.log('Creating DirectConversation table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "DirectConversation" (
                "id" TEXT NOT NULL,
                "participant1Id" TEXT NOT NULL,
                "participant2Id" TEXT NOT NULL,
                "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "DirectConversation_pkey" PRIMARY KEY ("id")
            );
        `);

        // 10. Create DirectMessage Table
        console.log('Creating DirectMessage table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "DirectMessage" (
                "id" TEXT NOT NULL,
                "conversationId" TEXT NOT NULL,
                "senderId" TEXT NOT NULL,
                "senderName" TEXT NOT NULL,
                "content" TEXT NOT NULL,
                "attachmentUrl" TEXT,
                "attachmentType" TEXT,
                "attachmentName" TEXT,
                "readAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "DirectConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
        } catch (e) { }

        console.log('Successfully applied manual schema fixes!');

    } catch (error) {
        console.error('Error applying fixes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
