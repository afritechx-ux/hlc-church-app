import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SendGroupMessageDto {
    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    attachmentUrl?: string;

    @IsString()
    @IsOptional()
    attachmentType?: string;

    @IsString()
    @IsOptional()
    attachmentName?: string;
}

export enum GroupChatTypeDto {
    GROUP = 'GROUP',
    DEPARTMENT = 'DEPARTMENT',
}

export class GetOrCreateChatDto {
    @IsEnum(GroupChatTypeDto)
    type: GroupChatTypeDto;

    @IsString()
    @IsOptional()
    groupId?: string;

    @IsString()
    @IsOptional()
    departmentId?: string;
}
