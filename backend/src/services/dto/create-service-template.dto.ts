import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsInt()
    defaultDuration?: number;

    @IsOptional()
    @IsString()
    campus?: string;
}
