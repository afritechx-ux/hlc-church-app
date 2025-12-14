import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { AtGuard } from '../common/guards';

@Controller('reports')
@UseGuards(AtGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('attendance/csv')
    async exportAttendanceCsv(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Res() res: Response,
    ) {
        const csv = await this.reportsService.generateAttendanceCsv(startDate, endDate);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${startDate}-${endDate}.csv`);
        res.send(csv);
    }

    @Get('giving/csv')
    async exportGivingCsv(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Res() res: Response,
    ) {
        const csv = await this.reportsService.generateGivingCsv(startDate, endDate);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=giving-${startDate}-${endDate}.csv`);
        res.send(csv);
    }

    @Get('members/csv')
    async exportMembersCsv(@Res() res: Response) {
        const csv = await this.reportsService.generateMembersCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=members-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    }

    @Get('summary')
    async getSummary(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.reportsService.getSummaryStats(startDate, endDate);
    }
}
