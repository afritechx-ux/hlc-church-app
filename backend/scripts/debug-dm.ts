

import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');

        // 1. Find 2 users
        const users = await prisma.user.findMany({ take: 2 });
        if (users.length < 2) {
            console.log('Not enough users to test DM. Found:', users.length);
            return;
        }

        const user1 = users[0];
        const user2 = users[1];
        console.log(`Testing DM between ${user1.email} (${user1.id}) and ${user2.email} (${user2.id})`);

        // 2. Simulate getOrCreateConversation (User1 -> User2)
        console.log('Simulating getOrCreateConversation...');

        // Logic from Service
        let conversation = await prisma.directConversation.findFirst({
            where: {
                OR: [
                    { participant1Id: user1.id, participant2Id: user2.id },
                    { participant1Id: user2.id, participant2Id: user1.id },
                ],
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            console.log('Conversation not found, creating...');
            conversation = await prisma.directConversation.create({
                data: {
                    participant1Id: user1.id,
                    participant2Id: user2.id,
                },
                include: {
                    messages: true,
                },
            });
        }
        console.log('Conversation:', conversation.id);

        // 3. Simulate getting other participant
        // Logic from Service
        const participantId = user2.id;
        const otherUser = await prisma.user.findUnique({
            where: { id: participantId },
            include: { member: true },
        });

        // Simulate formatting
        const otherParticipant = {
            id: participantId,
            email: otherUser?.email,
            name: otherUser?.member
                ? `${otherUser.member.firstName} ${otherUser.member.lastName}`
                : otherUser?.email?.split('@')[0] || 'Unknown',
        };
        console.log('Other Participant:', otherParticipant);

        // 4. Simulate sending message
        console.log('Simulating sendMessage...');
        const dto = {
            content: 'Test message from debug script',
            attachmentUrl: null,
            attachmentType: null,
            attachmentName: null,
        };

        const senderName = user1.email.split('@')[0];

        const message = await prisma.directMessage.create({
            data: {
                conversationId: conversation.id,
                senderId: user1.id,
                senderName: senderName,
                content: dto.content,
            },
        });
        console.log('Message created:', message.id);

        // Update conversation
        await prisma.directConversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
        });
        console.log('Conversation updated.');

        console.log('SUCCESS: DM flow working correctly in script.');

    } catch (error) {
        console.error('ERROR in debug script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
