import { Module } from '@nestjs/common';
import { GivingService } from './giving.service';
import { GivingController } from './giving.controller';

@Module({
    controllers: [GivingController],
    providers: [GivingService],
    exports: [GivingService],
})
export class GivingModule { }
