import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { MessageChannel } from '@prisma/client';

export class CreateMessageDto {
    @IsString()
    subject: string;

    @IsString()
    body: string;

    @IsEnum(MessageChannel)
    @IsOptional()
    channel?: MessageChannel = MessageChannel.NOTIFICATION;

    @IsString()
    @IsOptional()
    type?: string = 'announcement';

    @IsString()
    recipientType: 'all' | 'department' | 'individual' | 'birthday';

    @IsString()
    @IsOptional()
    departmentId?: string;

    @IsArray()
    @IsOptional()
    memberIds?: string[];
}

export class CreateTemplateDto {
    @IsString()
    name: string;

    @IsString()
    type: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    body: string;

    @IsArray()
    @IsOptional()
    variables?: string[];
}

export class UpdateTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    body?: string;

    @IsArray()
    @IsOptional()
    variables?: string[];
}
