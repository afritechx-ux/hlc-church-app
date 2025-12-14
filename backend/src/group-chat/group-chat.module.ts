import { Module } from '@nestjs/common';
import { GroupChatController } from './group-chat.controller';
import { GroupChatService } from './group-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [GroupChatController],
    providers: [GroupChatService],
    exports: [GroupChatService],
})
export class GroupChatModule { }
