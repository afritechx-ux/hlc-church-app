import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto, SendMessageDto, UpdateChatStatusDto } from './dto';
import { ChatStatus } from '@prisma/client';

// AI Response patterns for common questions
const AI_RESPONSES: Record<string, string> = {
    'check in': 'To check in for a service, open the app during service and tap the QR scanner on the home screen. Point your camera at the QR code displayed on screen.',
    'checkin': 'To check in for a service, open the app during service and tap the QR scanner on the home screen. Point your camera at the QR code displayed on screen.',
    'donate': 'To donate, go to the Giving section in the app. You can choose a fund, enter an amount, and select your payment method.',
    'give': 'To give, go to the Giving section in the app. You can choose a fund, enter an amount, and select your payment method.',
    'service time': 'Our main service is on Sundays at 9:00 AM and 11:00 AM. Wednesday Bible study is at 7:00 PM.',
    'service': 'Our main service is on Sundays at 9:00 AM and 11:00 AM. Wednesday Bible study is at 7:00 PM.',
    'contact': 'You can reach the church office at info@hlag.com or call (123) 456-7890 during office hours (Mon-Fri 9AM-5PM).',
    'join': 'To join a group or department, visit the Groups section in the app and tap "Join" on any group you\'re interested in.',
    'group': 'To view or join groups, go to the Groups section in the app. You can see meeting times and locations for each group.',
    'hello': 'Hello! I\'m here to help. You can ask me about check-in, donations, service times, or groups. Type "talk to admin" if you need to speak with a real person.',
    'hi': 'Hi there! How can I help you today? Ask about check-in, giving, service times, or type "talk to admin" to chat with someone.',
    'help': 'I can help you with: \n• Check-in instructions\n• Donation/Giving\n• Service times\n• Joining groups\n\nType "talk to admin" to speak with a real person.',
};

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // Get AI response for a message
    private getAiResponse(message: string): string | null {
        const lowerMessage = message.toLowerCase();

        for (const [keyword, response] of Object.entries(AI_RESPONSES)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        return null;
    }

    // Get or create a chat for a user
    async getOrCreateChat(userId: string, userEmail: string, userName: string, dto?: CreateChatDto) {
        // Check if user has an open chat
        let chat = await this.prisma.chat.findFirst({
            where: {
                userId,
                status: 'OPEN',
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });

        if (!chat) {
            // Create new chat with welcome message
            chat = await this.prisma.chat.create({
                data: {
                    userId,
                    userEmail,
                    userName,
                    subject: dto?.subject,
                    messages: {
                        create: {
                            senderId: 'system',
                            senderName: 'Church Assistant',
                            isAdmin: true,
                            content: 'Hello! I\'m your church assistant. I can help with check-in, donations, service times, and more. Type "talk to admin" if you need to speak with a real person.',
                        },
                    },
                },
                include: {
                    messages: true,
                },
            });
        }

        return chat;
    }

    // Get all chats for admin view
    async getAllChats(status?: ChatStatus) {
        const where = status ? { status } : {};

        return this.prisma.chat.findMany({
            where,
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
    }

    // Get escalated chats (for admin)
    async getEscalatedChats() {
        return this.prisma.chat.findMany({
            where: {
                isEscalated: true,
                status: 'OPEN',
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
    }

    // Get a specific chat with messages
    async getChat(chatId: string, userId: string, isAdmin: boolean) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Only the chat owner or admin can view
        if (!isAdmin && chat.userId !== userId) {
            throw new ForbiddenException('You do not have access to this chat');
        }

        return chat;
    }

    // Get user's chat history
    async getUserChats(userId: string) {
        return this.prisma.chat.findMany({
            where: { userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    // Send a message (with AI auto-response for non-escalated chats)
    async sendMessage(
        chatId: string,
        senderId: string,
        senderName: string,
        isAdmin: boolean,
        dto: SendMessageDto,
    ) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Verify access
        if (!isAdmin && chat.userId !== senderId) {
            throw new ForbiddenException('You do not have access to this chat');
        }

        // Check if user wants to escalate
        const lowerContent = dto.content.toLowerCase();
        if (!isAdmin && (lowerContent.includes('talk to admin') || lowerContent.includes('speak to admin') || lowerContent.includes('real person'))) {
            // Escalate the chat
            const escalatedChat = await this.escalateChat(chatId);

            // Create user message
            await this.prisma.chatMessage.create({
                data: {
                    chatId,
                    senderId,
                    senderName,
                    isAdmin: false,
                    content: dto.content,
                },
            });

            // Create escalation confirmation message
            const confirmMessage = await this.prisma.chatMessage.create({
                data: {
                    chatId,
                    senderId: 'system',
                    senderName: 'Church Assistant',
                    isAdmin: true,
                    content: 'I\'ve notified our team. An admin will be with you shortly. Please wait or continue describing your question.',
                },
            });

            await this.prisma.chat.update({
                where: { id: chatId },
                data: { lastMessageAt: new Date() },
            });

            return confirmMessage;
        }

        // Create user message
        const userMessage = await this.prisma.chatMessage.create({
            data: {
                chatId,
                senderId,
                senderName,
                isAdmin,
                content: dto.content,
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                attachmentName: dto.attachmentName,
            },
        });

        await this.prisma.chat.update({
            where: { id: chatId },
            data: { lastMessageAt: new Date() },
        });

        // If not admin and chat is not escalated, try AI response
        if (!isAdmin && !chat.isEscalated) {
            const aiResponse = this.getAiResponse(dto.content);
            if (aiResponse) {
                // Small delay to make it feel more natural
                await this.prisma.chatMessage.create({
                    data: {
                        chatId,
                        senderId: 'system',
                        senderName: 'Church Assistant',
                        isAdmin: true,
                        content: aiResponse,
                    },
                });

                await this.prisma.chat.update({
                    where: { id: chatId },
                    data: { lastMessageAt: new Date() },
                });
            }
        }

        return userMessage;
    }

    // Escalate chat to admin
    async escalateChat(chatId: string) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        return this.prisma.chat.update({
            where: { id: chatId },
            data: { isEscalated: true },
        });
    }

    // Mark messages as read
    async markAsRead(chatId: string, userId: string, isAdmin: boolean) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Mark messages from the other party as read
        await this.prisma.chatMessage.updateMany({
            where: {
                chatId,
                isAdmin: !isAdmin, // Mark messages from the other side
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });

        return { success: true };
    }

    // Update chat status (admin only)
    async updateChatStatus(chatId: string, dto: UpdateChatStatusDto) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        return this.prisma.chat.update({
            where: { id: chatId },
            data: { status: dto.status },
        });
    }

    // Assign chat to admin
    async assignChat(chatId: string, adminId: string) {
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        return this.prisma.chat.update({
            where: { id: chatId },
            data: { assignedTo: adminId },
        });
    }

    // Get unread message count for admin (only escalated chats)
    async getUnreadCount() {
        return this.prisma.chatMessage.count({
            where: {
                isAdmin: false,
                readAt: null,
                chat: {
                    isEscalated: true,
                },
            },
        });
    }

    // Get new messages since a timestamp (for polling)
    async getNewMessages(chatId: string, since: Date) {
        return this.prisma.chatMessage.findMany({
            where: {
                chatId,
                createdAt: { gt: since },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
