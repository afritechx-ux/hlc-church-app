import { Module } from '@nestjs/common';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DirectMessagesController],
    providers: [DirectMessagesService],
})
export class DirectMessagesModule { }
