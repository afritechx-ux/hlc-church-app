import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto, UpdateChatStatusDto } from './dto';
import { AtGuard } from '../common/guards/at.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { ChatStatus } from '@prisma/client';

@UseGuards(AtGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    // ============ ADMIN ENDPOINTS (must be before :id routes) ============

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN', 'PASTOR')
    async getAllChats(@Query('status') status?: ChatStatus) {
        return this.chatService.getAllChats(status);
    }

    @Get('admin/escalated')
    @UseGuards(RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN', 'PASTOR')
    async getEscalatedChats() {
        return this.chatService.getEscalatedChats();
    }

    @Get('admin/unread-count')
    @UseGuards(RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN', 'PASTOR')
    async getUnreadCount() {
        return this.chatService.getUnreadCount();
    }

    // ============ USER ENDPOINTS ============

    @Post()
    async createOrGetChat(
        @GetCurrentUser('sub') userId: string,
        @GetCurrentUser('email') email: string,
        @Body() dto: CreateChatDto,
    ) {
        // Get user info for display
        return this.chatService.getOrCreateChat(userId, email, email.split('@')[0], dto);
    }

    @Get('my')
    async getMyChats(@GetCurrentUser('sub') userId: string) {
        return this.chatService.getUserChats(userId);
    }

    // ============ PARAMETERIZED ROUTES (must be after static routes) ============

    @Get(':id')
    async getChat(
        @Param('id') chatId: string,
        @GetCurrentUser('sub') userId: string,
        @GetCurrentUser('role') role: string,
    ) {
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'].includes(role);
        return this.chatService.getChat(chatId, userId, isAdmin);
    }

    @Post(':id/messages')
    async sendMessage(
        @Param('id') chatId: string,
        @GetCurrentUser('sub') userId: string,
        @GetCurrentUser('email') email: string,
        @GetCurrentUser('role') role: string,
        @Body() dto: SendMessageDto,
    ) {
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'].includes(role);
        return this.chatService.sendMessage(
            chatId,
            userId,
            email.split('@')[0],
            isAdmin,
            dto,
        );
    }

    @Post(':id/read')
    async markAsRead(
        @Param('id') chatId: string,
        @GetCurrentUser('sub') userId: string,
        @GetCurrentUser('role') role: string,
    ) {
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'PASTOR'].includes(role);
        return this.chatService.markAsRead(chatId, userId, isAdmin);
    }

    @Get(':id/messages/new')
    async getNewMessages(
        @Param('id') chatId: string,
        @Query('since') since: string,
    ) {
        return this.chatService.getNewMessages(chatId, new Date(since));
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN', 'PASTOR')
    async updateStatus(
        @Param('id') chatId: string,
        @Body() dto: UpdateChatStatusDto,
    ) {
        return this.chatService.updateChatStatus(chatId, dto);
    }

    @Post(':id/assign')
    @UseGuards(RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN', 'PASTOR')
    async assignChat(
        @Param('id') chatId: string,
        @GetCurrentUser('sub') adminId: string,
    ) {
        return this.chatService.assignChat(chatId, adminId);
    }
}
