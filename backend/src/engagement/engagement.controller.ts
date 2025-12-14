import { Controller, Get, Param, Post } from '@nestjs/common';
import { EngagementService } from './engagement.service';

@Controller('engagement')
export class EngagementController {
    constructor(private readonly engagementService: EngagementService) { }

    @Get('members/:id')
    getScore(@Param('id') id: string) {
        return this.engagementService.getScore(id);
    }

    @Post('calculate/:id')
    calculateScore(@Param('id') id: string) {
        return this.engagementService.calculateScore(id);
    }
}
