import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
    @IsString()
    @IsNotEmpty()
    participantId: string; // The other user's ID
}

export class SendDirectMessageDto {
    @IsString()
    @IsNotEmpty()
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
