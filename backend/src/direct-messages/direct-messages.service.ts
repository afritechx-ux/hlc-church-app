import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, SendDirectMessageDto } from './dto';

@Injectable()
export class DirectMessagesService {
    constructor(private prisma: PrismaService) { }

    // Get all conversations for a user
    async getConversations(userId: string) {
        const conversations = await this.prisma.directConversation.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId },
                ],
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });

        // Enrich with participant info and unread count
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const otherParticipantId = conv.participant1Id === userId
                    ? conv.participant2Id
                    : conv.participant1Id;

                // Get the other participant's member info
                const otherUser = await this.prisma.user.findUnique({
                    where: { id: otherParticipantId },
                    include: { member: true },
                });

                // Count unread messages
                const unreadCount = await this.prisma.directMessage.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { not: userId },
                        readAt: null,
                    },
                });

                return {
                    ...conv,
                    otherParticipant: {
                        id: otherParticipantId,
                        email: otherUser?.email,
                        name: otherUser?.member
                            ? `${otherUser.member.firstName} ${otherUser.member.lastName}`
                            : otherUser?.email?.split('@')[0] || 'Unknown',
                        photoUrl: null, // Add if member has photo
                    },
                    lastMessage: conv.messages[0] || null,
                    unreadCount,
                };
            })
        );

        return enrichedConversations;
    }

    // Get or create a conversation with another user
    async getOrCreateConversation(userId: string, dto: CreateConversationDto) {
        const { participantId } = dto;

        if (userId === participantId) {
            throw new ForbiddenException('Cannot create conversation with yourself');
        }

        // Check if conversation already exists (in either order)
        let conversation = await this.prisma.directConversation.findFirst({
            where: {
                OR: [
                    { participant1Id: userId, participant2Id: participantId },
                    { participant1Id: participantId, participant2Id: userId },
                ],
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            // Create new conversation
            conversation = await this.prisma.directConversation.create({
                data: {
                    participant1Id: userId,
                    participant2Id: participantId,
                },
                include: {
                    messages: true,
                },
            });
        }

        // Get the other participant's info
        const otherUser = await this.prisma.user.findUnique({
            where: { id: participantId },
            include: { member: true },
        });

        return {
            ...conversation,
            otherParticipant: {
                id: participantId,
                email: otherUser?.email,
                name: otherUser?.member
                    ? `${otherUser.member.firstName} ${otherUser.member.lastName}`
                    : otherUser?.email?.split('@')[0] || 'Unknown',
            },
        };
    }

    // Get a specific conversation with messages
    async getConversation(conversationId: string, userId: string) {
        const conversation = await this.prisma.directConversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Verify user is a participant
        if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
            throw new ForbiddenException('Not a participant in this conversation');
        }

        // Get the other participant's info
        const otherParticipantId = conversation.participant1Id === userId
            ? conversation.participant2Id
            : conversation.participant1Id;

        const otherUser = await this.prisma.user.findUnique({
            where: { id: otherParticipantId },
            include: { member: true },
        });

        return {
            ...conversation,
            otherParticipant: {
                id: otherParticipantId,
                email: otherUser?.email,
                name: otherUser?.member
                    ? `${otherUser.member.firstName} ${otherUser.member.lastName}`
                    : otherUser?.email?.split('@')[0] || 'Unknown',
            },
        };
    }

    // Send a message in a conversation
    async sendMessage(
        conversationId: string,
        senderId: string,
        senderName: string,
        dto: SendDirectMessageDto,
    ) {
        // Verify conversation exists and user is a participant
        const conversation = await this.prisma.directConversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
            throw new ForbiddenException('Not a participant in this conversation');
        }

        // Create the message
        const message = await this.prisma.directMessage.create({
            data: {
                conversationId,
                senderId,
                senderName,
                content: dto.content,
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                attachmentName: dto.attachmentName,
            },
        });

        // Update conversation's lastMessageAt
        await this.prisma.directConversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });

        return message;
    }

    // Mark messages as read
    async markAsRead(conversationId: string, userId: string) {
        // Mark all messages from the other participant as read
        await this.prisma.directMessage.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        return { success: true };
    }

    // Get new messages since a timestamp (for polling)
    async getNewMessages(conversationId: string, since: Date) {
        return this.prisma.directMessage.findMany({
            where: {
                conversationId,
                createdAt: { gt: since },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Get members list for starting a new conversation
    async getMembersList(currentUserId: string) {
        const users = await this.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                member: { isNot: null },
            },
            include: {
                member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return users.map(user => ({
            userId: user.id,
            memberId: user.member?.id,
            name: `${user.member?.firstName} ${user.member?.lastName}`,
            email: user.email,
        }));
    }

    // =============== ADMIN METHODS ===============

    // Get all conversations (admin oversight)
    async getAllConversationsAdmin(search?: string) {
        const conversations = await this.prisma.directConversation.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });

        // Enrich with participant info
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const [user1, user2] = await Promise.all([
                    this.prisma.user.findUnique({
                        where: { id: conv.participant1Id },
                        include: { member: true },
                    }),
                    this.prisma.user.findUnique({
                        where: { id: conv.participant2Id },
                        include: { member: true },
                    }),
                ]);

                const participant1Name = user1?.member
                    ? `${user1.member.firstName} ${user1.member.lastName}`
                    : user1?.email?.split('@')[0] || 'Unknown';

                const participant2Name = user2?.member
                    ? `${user2.member.firstName} ${user2.member.lastName}`
                    : user2?.email?.split('@')[0] || 'Unknown';

                return {
                    ...conv,
                    participant1: {
                        id: conv.participant1Id,
                        name: participant1Name,
                        email: user1?.email,
                    },
                    participant2: {
                        id: conv.participant2Id,
                        name: participant2Name,
                        email: user2?.email,
                    },
                    lastMessage: conv.messages[0] || null,
                    messageCount: await this.prisma.directMessage.count({
                        where: { conversationId: conv.id },
                    }),
                };
            })
        );

        // Filter by search if provided
        if (search) {
            const searchLower = search.toLowerCase();
            return enrichedConversations.filter(
                conv =>
                    conv.participant1.name.toLowerCase().includes(searchLower) ||
                    conv.participant2.name.toLowerCase().includes(searchLower) ||
                    conv.participant1.email?.toLowerCase().includes(searchLower) ||
                    conv.participant2.email?.toLowerCase().includes(searchLower)
            );
        }

        return enrichedConversations;
    }

    // Get a specific conversation with messages (admin)
    async getConversationAsAdmin(conversationId: string) {
        console.log(`[Admin] Fetching conversation ${conversationId}`);
        const conversation = await this.prisma.directConversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!conversation) {
            console.error(`[Admin] Conversation ${conversationId} not found`);
            throw new NotFoundException('Conversation not found');
        }

        // Get both participants' info
        const [user1, user2] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: conversation.participant1Id },
                include: { member: true },
            }),
            this.prisma.user.findUnique({
                where: { id: conversation.participant2Id },
                include: { member: true },
            }),
        ]);

        if (!user1) console.warn(`[Admin] User 1 (${conversation.participant1Id}) not found for chat ${conversationId}`);
        if (!user2) console.warn(`[Admin] User 2 (${conversation.participant2Id}) not found for chat ${conversationId}`);

        return {
            ...conversation,
            participant1: {
                id: conversation.participant1Id,
                name: user1?.member
                    ? `${user1.member.firstName} ${user1.member.lastName}`
                    : user1?.email?.split('@')[0] || 'Unknown',
                email: user1?.email || '', // Ensure string
            },
            participant2: {
                id: conversation.participant2Id,
                name: user2?.member
                    ? `${user2.member.firstName} ${user2.member.lastName}`
                    : user2?.email?.split('@')[0] || 'Unknown',
                email: user2?.email || '', // Ensure string
            },
        };
    }

    // Send a message as admin (intervention)
    async sendMessageAsAdmin(
        conversationId: string,
        adminId: string,
        adminName: string,
        dto: SendDirectMessageDto,
    ) {
        const conversation = await this.prisma.directConversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Create the message with admin indicator
        const message = await this.prisma.directMessage.create({
            data: {
                conversationId,
                senderId: adminId,
                senderName: `${adminName} (Admin)`,
                content: dto.content,
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                attachmentName: dto.attachmentName,
            },
        });

        // Update conversation's lastMessageAt
        await this.prisma.directConversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });

        return message;
    }
}

