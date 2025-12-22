import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    constructor(private settingsService: SettingsService) { }

    async sendSms(to: string, message: string) {
        const settings = await this.settingsService.getSettings();

        if (!settings.smsApiKey) {
            this.logger.warn(`SMS to ${to} skipped - No SMS API Key found. Configure in Settings.`);
            this.logger.log(`Message: ${message}`);
            return false;
        }

        try {
            // Placeholder for real SMS implementation (e.g. Hubtel, Twilio, MNotify)
            // Implementation depends on the specific provider chosen by the user

            // Example generic structure:
            // await axios.post('https://api.sms-provider.com/send', {
            //     key: settings.smsApiKey,
            //     to,
            //     sender: settings.smsSenderId || 'Church',
            //     msg: message
            // });

            this.logger.log(`[MOCK] SMS sent to ${to}: ${message}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
            return false;
        }
    }
}
