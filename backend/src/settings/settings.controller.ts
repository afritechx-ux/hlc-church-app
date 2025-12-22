import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    // Admin endpoint - get all settings
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    async getSettings() {
        return this.settingsService.getSettings();
    }

    // Admin endpoint - update settings
    @Patch()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    async updateSettings(@Body() data: {
        name?: string;
        address?: string;
        website?: string;
        officePhone?: string;
        pastorPhone?: string;
        prayerLinePhone?: string;
        adminEmail?: string;
        supportEmail?: string;
        timezone?: string;
        currency?: string;
    }) {
        return this.settingsService.updateSettings(data);
    }

    // Public endpoint for mobile app - only returns contact info
    @Get('contact')
    @Public()
    async getPublicContactInfo() {
        return this.settingsService.getPublicContactInfo();
    }
}
