import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { GroupChatService } from './group-chat.service';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators';
import { AtGuard } from '../common/guards';
import { SendGroupMessageDto, GetOrCreateChatDto, GroupChatTypeDto } from './dto/group-chat.dto';
import { GroupChatType } from '@prisma/client';

@UseGuards(AtGuard)
@Controller('group-chat')
export class GroupChatController {
    constructor(private readonly service: GroupChatService) { }

    // Get all group chats for the current user
    @Get('my-chats')
    async getMyChats(@GetCurrentUserId() userId: string) {
        return this.service.getChatsForUser(userId);
    }

    // Get total unread count across all chats
    @Get('unread-count')
    async getUnreadCount(@GetCurrentUserId() userId: string) {
        const count = await this.service.getTotalUnreadCount(userId);
        return { count };
    }

    // Get or create a chat for a group/department
    @Post('chat')
    async getOrCreateChat(
        @Body() dto: GetOrCreateChatDto,
    ) {
        const type = dto.type === GroupChatTypeDto.GROUP ? GroupChatType.GROUP : GroupChatType.DEPARTMENT;
        return this.service.getOrCreateChat(type, dto.groupId, dto.departmentId);
    }

    // Get chat with messages
    @Get(':id')
    async getChat(
        @Param('id') chatId: string,
        @GetCurrentUserId() userId: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        return this.service.getChatWithMessages(
            chatId,
            userId,
            limit ? parseInt(limit) : 50,
            before,
        );
    }

    // Send a message
    @Post(':id/messages')
    async sendMessage(
        @Param('id') chatId: string,
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('email') email: string,
        @Body() dto: SendGroupMessageDto,
    ) {
        // Get member ID for the user
        const senderName = email.split('@')[0];

        // We'll get the memberId inside the service if needed
        return this.service.sendMessage(chatId, userId, senderName, null, dto);
    }

    // Mark messages as read
    @Post(':id/read')
    async markAsRead(
        @Param('id') chatId: string,
        @GetCurrentUserId() userId: string,
    ) {
        return this.service.markAsRead(chatId, userId);
    }

    // Get new messages since a timestamp (for polling)
    @Get(':id/messages/new')
    async getNewMessages(
        @Param('id') chatId: string,
        @GetCurrentUserId() userId: string,
        @Query('since') since: string,
    ) {
        return this.service.getNewMessages(chatId, userId, new Date(since));
    }
}
