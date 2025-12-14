import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateMessageDto, CreateTemplateDto, UpdateTemplateDto } from './dto/messaging.dto';
import { GetCurrentUserId } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('messaging')
@UseGuards(RolesGuard)
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) { }

    // ============ MESSAGES ============

    @Post('send')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR)
    async sendMessage(
        @Body() dto: CreateMessageDto,
        @GetCurrentUserId() userId: string,
    ) {
        return this.messagingService.sendMessage(dto, userId);
    }

    @Get('history')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR)
    async getMessageHistory(@GetCurrentUserId() userId: string) {
        return this.messagingService.findAllMessages();
    }

    @Get('history/:id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR)
    async getMessageById(@Param('id') id: string) {
        return this.messagingService.findMessageById(id);
    }

    // ============ BIRTHDAYS ============

    @Get('birthdays/today')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR, Role.DEPARTMENT_LEADER)
    async getTodaysBirthdays() {
        return this.messagingService.getTodaysBirthdays();
    }

    @Get('birthdays/upcoming')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR, Role.DEPARTMENT_LEADER)
    async getUpcomingBirthdays(@Query('days') days?: string) {
        return this.messagingService.getUpcomingBirthdays(days ? parseInt(days) : 7);
    }

    // ============ TEMPLATES ============

    @Get('templates')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PASTOR)
    async getTemplates() {
        return this.messagingService.findAllTemplates();
    }

    @Post('templates')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async createTemplate(@Body() dto: CreateTemplateDto) {
        return this.messagingService.createTemplate(dto);
    }

    @Patch('templates/:id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async updateTemplate(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateDto,
    ) {
        return this.messagingService.updateTemplate(id, dto);
    }

    @Delete('templates/:id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async deleteTemplate(@Param('id') id: string) {
        return this.messagingService.deleteTemplate(id);
    }

    // ============ SEED ============

    @Post('seed-templates')
    @Roles(Role.SUPER_ADMIN)
    async seedTemplates() {
        await this.messagingService.seedDefaultTemplates();
        return { message: 'Default templates seeded' };
    }
}
