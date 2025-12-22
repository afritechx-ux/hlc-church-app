import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
    imports: [NotificationsModule, SettingsModule],
    controllers: [MessagingController],
    providers: [MessagingService, EmailService, SmsService],
    exports: [MessagingService],
})
export class MessagingModule { }
