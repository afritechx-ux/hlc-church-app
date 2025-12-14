import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUserId } from '../common/decorators/get-current-user-id.decorator';
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

    @Get('qr-token/:occurrenceId')
    getQrToken(@Param('occurrenceId') occurrenceId: string) {
        return this.attendanceService.generateQRToken(occurrenceId);
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
