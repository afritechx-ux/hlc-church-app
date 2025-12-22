import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getSettings() {
        // Get or create the singleton settings record
        let settings = await this.prisma.organizationSettings.findFirst();

        if (!settings) {
            settings = await this.prisma.organizationSettings.create({
                data: {
                    name: 'Higher Life Chapel',
                    timezone: 'Africa/Accra',
                    currency: 'GHS',
                },
            });
        }

        return settings;
    }

    async updateSettings(data: {
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
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smsApiKey?: string;
        smsSenderId?: string;
    }) {
        // Get or create settings first
        let settings = await this.prisma.organizationSettings.findFirst();

        if (!settings) {
            // Create with the provided data
            return this.prisma.organizationSettings.create({
                data: {
                    name: data.name || 'Higher Life Chapel',
                    address: data.address,
                    website: data.website,
                    officePhone: data.officePhone,
                    pastorPhone: data.pastorPhone,
                    prayerLinePhone: data.prayerLinePhone,
                    adminEmail: data.adminEmail,
                    supportEmail: data.supportEmail,
                    timezone: data.timezone || 'Africa/Accra',
                    currency: data.currency || 'GHS',
                    smtpHost: data.smtpHost,
                    smtpPort: data.smtpPort,
                    smtpUser: data.smtpUser,
                    smtpPass: data.smtpPass,
                    smsApiKey: data.smsApiKey,
                    smsSenderId: data.smsSenderId,
                },
            });
        }

        // Update existing settings
        return this.prisma.organizationSettings.update({
            where: { id: settings.id },
            data,
        });
    }

    // Public endpoint for mobile app - only returns contact info
    async getPublicContactInfo() {
        const settings = await this.getSettings();

        return {
            churchName: settings.name,
            officePhone: settings.officePhone,
            pastorPhone: settings.pastorPhone,
            prayerLinePhone: settings.prayerLinePhone,
            supportEmail: settings.supportEmail,
            website: settings.website,
        };
    }
}
