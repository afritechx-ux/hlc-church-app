import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('automations')
@UseGuards(RolesGuard)
export class AutomationsController {
    constructor(private readonly automationsService: AutomationsService) { }

    @Get('status')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    getStatus() {
        return {
            status: 'active',
            jobs: [
                'Nightly Engagement Score',
                'Weekly Inactive Member Detection',
                'Service Reminders'
            ]
        };
    }

    @Post('trigger/nightly-score')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async triggerNightlyScore() {
        await this.automationsService.handleNightlyScoring();
        return { message: 'Nightly scoring triggered' };
    }

    @Post('trigger/inactive-members')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async triggerInactiveMembers() {
        await this.automationsService.handleInactiveMemberDetection();
        return { message: 'Inactive member detection triggered' };
    }

    @Post('trigger/service-reminders')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    async triggerServiceReminders() {
        await this.automationsService.handleServiceReminders();
        return { message: 'Service reminders triggered' };
    }
}
