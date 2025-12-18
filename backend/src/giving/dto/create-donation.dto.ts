import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    MOBILE_MONEY = 'MOBILE_MONEY',
    BANK_TRANSFER = 'BANK_TRANSFER',
    USSD = 'USSD',
    OTHER = 'OTHER',
}

export class CreateDonationDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    fundId: string;

    @IsOptional()
    @IsString()
    memberId?: string;

    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;
}
