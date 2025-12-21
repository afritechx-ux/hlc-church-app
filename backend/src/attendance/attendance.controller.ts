import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUserId } from '../common/decorators/get-current-user-id.decorator';
import { Public } from '../common/decorators';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { QrCheckInDto } from './dto/qr-check-in.dto';

@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('check-in')
    checkIn(@Body() checkInDto: CheckInDto) {
        return this.attendanceService.checkIn(checkInDto);
    }

    @Post('qr-check-in')
    qrCheckIn(
        @GetCurrentUserId() userId: string,
        @Body() qrCheckInDto: QrCheckInDto,
    ) {
        return this.attendanceService.qrCheckIn(userId, qrCheckInDto.token);
    }

    @Public()
    @Post('public-check-in')
    publicCheckIn(@Body() data: any) {
        return this.attendanceService.publicCheckIn(data);
    }

    @Patch(':id/link')
    linkToMember(
        @Param('id') id: string,
        @Body() data: { memberId: string },
    ) {
        return this.attendanceService.linkToMember(id, data.memberId);
    }

    @Get('qr-token/:occurrenceId')
    getQrToken(@Param('occurrenceId') occurrenceId: string) {
        return this.attendanceService.generateQRToken(occurrenceId);
    }

    @Get('static-qr-token/:occurrenceId')
    getStaticQrToken(@Param('occurrenceId') occurrenceId: string) {
        return this.attendanceService.generateStaticQRToken(occurrenceId);
    }

    @Get('service/:occurrenceId')
    getAttendanceByOccurrence(@Param('occurrenceId') occurrenceId: string) {
        return this.attendanceService.getAttendanceByOccurrence(occurrenceId);
    }

    @Get('member/:memberId')
    getAttendanceByMember(@Param('memberId') memberId: string) {
        return this.attendanceService.getAttendanceByMember(memberId);
    }

    @Get('streak/:memberId')
    getStreak(@Param('memberId') memberId: string) {
        return this.attendanceService.calculateStreak(memberId);
    }
}
