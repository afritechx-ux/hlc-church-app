import { PartialType } from '@nestjs/swagger';
import { FollowUpStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateFollowUpTaskDto } from './create-follow-up-task.dto';

export class UpdateFollowUpTaskDto extends PartialType(CreateFollowUpTaskDto) {
    @IsOptional()
    @IsEnum(FollowUpStatus)
    status?: FollowUpStatus;
}
