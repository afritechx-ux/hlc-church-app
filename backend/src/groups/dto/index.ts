import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum GroupType {
    SMALL_GROUP = 'SMALL_GROUP',
    BIBLE_STUDY = 'BIBLE_STUDY',
    PRAYER_GROUP = 'PRAYER_GROUP',
    FELLOWSHIP = 'FELLOWSHIP',
    OUTREACH = 'OUTREACH',
    OTHER = 'OTHER',
}

export class CreateGroupDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(GroupType)
    type?: GroupType;

    @IsOptional()
    @IsString()
    meetingDay?: string;

    @IsOptional()
    @IsString()
    meetingTime?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    leaderId?: string;
}

export class UpdateGroupDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(GroupType)
    type?: GroupType;

    @IsOptional()
    @IsString()
    meetingDay?: string;

    @IsOptional()
    @IsString()
    meetingTime?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    leaderId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AddMemberDto {
    @IsString()
    memberId: string;

    @IsOptional()
    @IsString()
    role?: string;
}
