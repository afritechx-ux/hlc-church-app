import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHouseholdDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    address?: string;
}
