import { Module } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { HouseholdsController } from './households.controller';

@Module({
    controllers: [HouseholdsController],
    providers: [HouseholdsService],
})
export class HouseholdsModule { }
