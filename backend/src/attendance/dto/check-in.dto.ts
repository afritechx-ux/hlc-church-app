import { AttendanceMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export { AttendanceMethod };

export class CheckInDto {
    @IsNotEmpty()
    @IsString()
    memberId: string;

    @IsNotEmpty()
    @IsString()
    serviceOccurrenceId: string;

    @IsOptional()
    @IsEnum(AttendanceMethod)
    method?: AttendanceMethod;
}
