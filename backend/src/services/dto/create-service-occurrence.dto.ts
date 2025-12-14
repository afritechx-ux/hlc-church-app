import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceOccurrenceDto {
    @IsNotEmpty()
    @IsString()
    templateId: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsDateString()
    startTime: string;

    @IsNotEmpty()
    @IsDateString()
    endTime: string;
}
