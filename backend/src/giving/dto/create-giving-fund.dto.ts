import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGivingFundDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    goal?: number;
}
