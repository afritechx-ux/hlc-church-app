import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateChatDto {
    @IsOptional()
    @IsString()
    subject?: string;
}

export class SendMessageDto {
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @IsOptional()
    @IsString()
    attachmentType?: string;

    @IsOptional()
    @IsString()
    attachmentName?: string;
}

export class UpdateChatStatusDto {
    @IsEnum(['OPEN', 'CLOSED'])
    status: 'OPEN' | 'CLOSED';
}
