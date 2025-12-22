import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private settingsService: SettingsService) { }

    async sendEmail(to: string, subject: string, html: string) {
        const settings = await this.settingsService.getSettings();

        // If no SMTP settings, log only (or use test account)
        if (!settings.smtpHost || !settings.smtpUser) {
            this.logger.warn(`Email to ${to} skipped - No SMTP configuration found. Configure in Settings.`);
            this.logger.log(`Subject: ${subject}`);
            return false;
        }

        try {
            const transporter = nodemailer.createTransport({
                host: settings.smtpHost,
                port: settings.smtpPort || 587,
                secure: settings.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: settings.smtpUser,
                    pass: settings.smtpPass,
                },
            });

            await transporter.sendMail({
                from: `"${settings.name}" <${settings.smtpUser}>`, // sender address
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            return false;
        }
    }
}
