import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetCurrentUserId } from '../common/decorators';
import { AtGuard } from '../common/guards';

@Controller('notifications')
@UseGuards(AtGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@GetCurrentUserId() userId: string) {
        return this.notificationsService.findAllForUser(userId);
    }

    @Get('unread-count')
    getUnreadCount(@GetCurrentUserId() userId: string) {
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @GetCurrentUserId() userId: string) {
        return this.notificationsService.markAsRead(id, userId);
    }

    @Patch('read-all')
    markAllAsRead(@GetCurrentUserId() userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }
}
