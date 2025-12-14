import { FollowUpStatus, FollowUpType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFollowUpTaskDto {
    @IsNotEmpty()
    @IsEnum(FollowUpType)
    type: FollowUpType;

    @IsNotEmpty()
    @IsString()
    memberId: string;

    @IsOptional()
    @IsString()
    assigneeId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
