import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AtGuard } from '../common/guards';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Public } from '../common/decorators';

@Controller('settings')
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    // Admin endpoint - get all settings
    @Get()
    @UseGuards(AtGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ADMIN')
    async getSettings() {
        return this.settingsService.getSettings();
    }

    // Admin endpoint - update settings
    @Patch()
    @UseGuards(AtGuard, RolesGuard)
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
