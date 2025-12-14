import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { DirectMessagesService } from './direct-messages.service';
import { CreateConversationDto, SendDirectMessageDto } from './dto';
import { AtGuard } from '../common/guards/at.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';

@UseGuards(AtGuard)
@Controller('direct-messages')
export class DirectMessagesController {
    constructor(private readonly dmService: DirectMessagesService) { }

    // Get all conversations for the current user
    @Get('conversations')
    async getConversations(@GetCurrentUser('sub') userId: string) {
        return this.dmService.getConversations(userId);
    }

    // Get list of members to start a conversation with
    @Get('members')
    async getMembersList(@GetCurrentUser('sub') userId: string) {
        return this.dmService.getMembersList(userId);
    }

    // Create or get a conversation with another member
    @Post('conversations')
    async createConversation(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.dmService.getOrCreateConversation(userId, dto);
    }

    // Get a specific conversation with messages
    @Get('conversations/:id')
    async getConversation(
        @Param('id') conversationId: string,
        @GetCurrentUser('sub') userId: string,
    ) {
        return this.dmService.getConversation(conversationId, userId);
    }

    // Send a message in a conversation
    @Post('conversations/:id/messages')
    async sendMessage(
        @Param('id') conversationId: string,
        @GetCurrentUser('sub') userId: string,
        @GetCurrentUser('email') email: string,
        @Body() dto: SendDirectMessageDto,
    ) {
        const senderName = email.split('@')[0];
        return this.dmService.sendMessage(conversationId, userId, senderName, dto);
    }

    // Mark messages as read
    @Post('conversations/:id/read')
    async markAsRead(
        @Param('id') conversationId: string,
        @GetCurrentUser('sub') userId: string,
    ) {
        return this.dmService.markAsRead(conversationId, userId);
    }

    // Get new messages since a timestamp (for polling)
    @Get('conversations/:id/messages/new')
    async getNewMessages(
        @Param('id') conversationId: string,
        @Query('since') since: string,
    ) {
        return this.dmService.getNewMessages(conversationId, new Date(since));
    }

    // =============== ADMIN ENDPOINTS ===============

    // Get all conversations (admin oversight)
    @Get('admin/all')
    async getAllConversationsAdmin(@Query('search') search?: string) {
        return this.dmService.getAllConversationsAdmin(search);
    }

    // Get a specific conversation as admin
    @Get('admin/conversation/:id')
    async getConversationAsAdmin(@Param('id') conversationId: string) {
        return this.dmService.getConversationAsAdmin(conversationId);
    }

    // Send message as admin (intervention in member DMs)
    @Post('admin/conversation/:id/messages')
    async sendMessageAsAdmin(
        @Param('id') conversationId: string,
        @GetCurrentUser('sub') adminId: string,
        @GetCurrentUser('email') email: string,
        @Body() dto: SendDirectMessageDto,
    ) {
        const adminName = email.split('@')[0];
        return this.dmService.sendMessageAsAdmin(conversationId, adminId, adminName, dto);
    }
}

