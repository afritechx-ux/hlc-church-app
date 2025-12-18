import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGivingFundDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    //@IsNumber() // Can be validated as string or number depending on transform
    goal?: number;
}
