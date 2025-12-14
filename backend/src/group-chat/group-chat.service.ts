import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GroupChatType } from '@prisma/client';
import { SendGroupMessageDto } from './dto/group-chat.dto';

@Injectable()
export class GroupChatService {
    private readonly logger = new Logger(GroupChatService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    // Get or create a group chat for a group or department
    async getOrCreateChat(type: GroupChatType, groupId?: string, departmentId?: string) {
        if (type === GroupChatType.GROUP && !groupId) {
            throw new Error('groupId is required for GROUP type');
        }
        if (type === GroupChatType.DEPARTMENT && !departmentId) {
            throw new Error('departmentId is required for DEPARTMENT type');
        }

        // Try to find existing chat
        const existingChat = await this.prisma.groupChat.findFirst({
            where: type === GroupChatType.GROUP
                ? { type, groupId }
                : { type, departmentId },
        });

        if (existingChat) {
            return existingChat;
        }

        // Get the name for the chat
        let name = '';
        if (type === GroupChatType.GROUP && groupId) {
            const group = await this.prisma.group.findUnique({ where: { id: groupId } });
            name = group?.name || 'Group Chat';
        } else if (type === GroupChatType.DEPARTMENT && departmentId) {
            const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
            name = dept?.name || 'Department Chat';
        }

        // Create new chat
        return this.prisma.groupChat.create({
            data: {
                type,
                groupId: type === GroupChatType.GROUP ? groupId : null,
                departmentId: type === GroupChatType.DEPARTMENT ? departmentId : null,
                name,
            },
        });
    }

    // Get all group chats that a user is a member of
    async getChatsForUser(userId: string) {
        // Get user's member record
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { member: true },
        });

        if (!user?.member) {
            return [];
        }

        const memberId = user.member.id;

        // Get groups the member belongs to
        const groupMemberships = await this.prisma.groupMember.findMany({
            where: { memberId },
            select: { groupId: true },
        });
        const groupIds = groupMemberships.map((gm) => gm.groupId);

        // Get departments the member belongs to
        const deptMemberships = await this.prisma.departmentMember.findMany({
            where: { memberId },
            select: { departmentId: true },
        });
        const departmentIds = deptMemberships.map((dm) => dm.departmentId);

        // Get all chats for these groups and departments
        const chats = await this.prisma.groupChat.findMany({
            where: {
                OR: [
                    { type: GroupChatType.GROUP, groupId: { in: groupIds } },
                    { type: GroupChatType.DEPARTMENT, departmentId: { in: departmentIds } },
                ],
            },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        // Get unread count for each chat
        const chatsWithUnread = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await this.getUnreadCountForChat(chat.id, userId);
                return {
                    ...chat,
                    lastMessage: chat.messages[0] || null,
                    unreadCount,
                };
            }),
        );

        return chatsWithUnread;
    }

    // Get chat with messages
    async getChatWithMessages(chatId: string, userId: string, limit = 50, before?: string) {
        // Verify user has access to this chat
        await this.verifyAccess(chatId, userId);

        const chat = await this.prisma.groupChat.findUnique({
            where: { id: chatId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    ...(before && {
                        cursor: { id: before },
                        skip: 1,
                    }),
                },
            },
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        return {
            ...chat,
            messages: chat.messages.reverse(), // Return in chronological order
        };
    }

    // Send a message to the group chat
    async sendMessage(
        chatId: string,
        userId: string,
        userName: string,
        memberId: string | null,
        dto: SendGroupMessageDto,
    ) {
        // Verify user has access
        await this.verifyAccess(chatId, userId);

        const chat = await this.prisma.groupChat.findUnique({
            where: { id: chatId },
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Create the message
        const message = await this.prisma.groupChatMessage.create({
            data: {
                chatId,
                senderId: userId,
                senderName: userName,
                memberId,
                content: dto.content,
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                attachmentName: dto.attachmentName,
            },
        });

        // Update last message time
        await this.prisma.groupChat.update({
            where: { id: chatId },
            data: { lastMessageAt: new Date() },
        });

        // Notify all other members
        await this.notifyMembers(chat, userId, userName, dto.content);

        return message;
    }

    // Mark messages as read
    async markAsRead(chatId: string, userId: string) {
        // Get all unread messages in this chat for this user
        const unreadMessages = await this.prisma.groupChatMessage.findMany({
            where: {
                chatId,
                senderId: { not: userId },
                readBy: {
                    none: { userId },
                },
            },
            select: { id: true },
        });

        if (unreadMessages.length === 0) {
            return { markedCount: 0 };
        }

        // Create read receipts
        await this.prisma.groupChatReadReceipt.createMany({
            data: unreadMessages.map((msg) => ({
                messageId: msg.id,
                userId,
            })),
            skipDuplicates: true,
        });

        return { markedCount: unreadMessages.length };
    }

    // Get unread count for a specific chat
    async getUnreadCountForChat(chatId: string, userId: string) {
        return this.prisma.groupChatMessage.count({
            where: {
                chatId,
                senderId: { not: userId },
                readBy: {
                    none: { userId },
                },
            },
        });
    }

    // Get total unread count across all chats
    async getTotalUnreadCount(userId: string) {
        const chats = await this.getChatsForUser(userId);
        return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    }

    // Get new messages since a timestamp
    async getNewMessages(chatId: string, userId: string, since: Date) {
        await this.verifyAccess(chatId, userId);

        return this.prisma.groupChatMessage.findMany({
            where: {
                chatId,
                createdAt: { gt: since },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Verify user has access to a chat
    private async verifyAccess(chatId: string, userId: string) {
        const chat = await this.prisma.groupChat.findUnique({
            where: { id: chatId },
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Get user's info including role and member record
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { member: true },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        // Allow admins to access any chat
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'PASTOR') {
            return true;
        }

        if (!user.member) {
            this.logger.warn(`User ${userId} has no member record - cannot access group chat`);
            throw new ForbiddenException('Your account is not linked to a member profile. Please contact admin.');
        }

        // Check if user is a member of the group/department
        if (chat.type === GroupChatType.GROUP && chat.groupId) {
            const membership = await this.prisma.groupMember.findFirst({
                where: { groupId: chat.groupId, memberId: user.member.id },
            });
            if (!membership) {
                this.logger.warn(`User ${userId} (member ${user.member.id}) is not a member of group ${chat.groupId}`);
                throw new ForbiddenException('You are not a member of this group');
            }
        } else if (chat.type === GroupChatType.DEPARTMENT && chat.departmentId) {
            const membership = await this.prisma.departmentMember.findFirst({
                where: { departmentId: chat.departmentId, memberId: user.member.id },
            });
            if (!membership) {
                this.logger.warn(`User ${userId} (member ${user.member.id}) is not a member of department ${chat.departmentId}`);
                throw new ForbiddenException('You are not a member of this department');
            }
        }

        return true;
    }

    // Notify all members of a new message
    private async notifyMembers(
        chat: { id: string; type: GroupChatType; groupId: string | null; departmentId: string | null; name: string },
        senderId: string,
        senderName: string,
        content: string,
    ) {
        try {
            let userIds: string[] = [];

            if (chat.type === GroupChatType.GROUP && chat.groupId) {
                // Get all group members
                const members = await this.prisma.groupMember.findMany({
                    where: { groupId: chat.groupId },
                    include: {
                        // We need to get the userId from the member
                    },
                });

                // Get member IDs and then get their user IDs
                const memberIds = members.map((m) => m.memberId);
                const users = await this.prisma.member.findMany({
                    where: { id: { in: memberIds }, userId: { not: null } },
                    select: { userId: true },
                });
                userIds = users.map((u) => u.userId!).filter((id) => id !== senderId);
            } else if (chat.type === GroupChatType.DEPARTMENT && chat.departmentId) {
                // Get all department members
                const members = await this.prisma.departmentMember.findMany({
                    where: { departmentId: chat.departmentId },
                    select: { memberId: true },
                });

                const memberIds = members.map((m) => m.memberId);
                const users = await this.prisma.member.findMany({
                    where: { id: { in: memberIds }, userId: { not: null } },
                    select: { userId: true },
                });
                userIds = users.map((u) => u.userId!).filter((id) => id !== senderId);
            }

            // Send notifications to all members
            const truncatedContent = content.length > 100 ? content.substring(0, 100) + '...' : content;
            for (const userId of userIds) {
                await this.notificationsService.create({
                    userId,
                    title: `${chat.name}`,
                    message: `${senderName}: ${truncatedContent}`,
                    type: 'info',
                });
            }
        } catch (error) {
            this.logger.error(`Failed to notify members: ${error.message}`);
        }
    }
}
