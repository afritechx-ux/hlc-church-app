import { IsNotEmpty, IsString } from 'class-validator';

export class QrCheckInDto {
    @IsNotEmpty()
    @IsString()
    token: string;
}
