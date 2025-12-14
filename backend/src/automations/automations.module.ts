import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EngagementModule } from '../engagement/engagement.module';
import { FollowUpsModule } from '../follow-ups/follow-ups.module';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        EngagementModule,
        FollowUpsModule,
    ],
    controllers: [AutomationsController],
    providers: [AutomationsService],
    exports: [AutomationsService],
})
export class AutomationsModule { }
