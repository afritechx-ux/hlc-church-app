import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreateGivingFundDto } from './dto/create-giving-fund.dto';
import { UpdateGivingFundDto } from './dto/update-giving-fund.dto';
import { GivingService } from './giving.service';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';

@Controller('giving')
export class GivingController {
    constructor(private readonly givingService: GivingService) { }

    // Funds
    @Post('funds')
    createFund(@Body() createGivingFundDto: CreateGivingFundDto) {
        return this.givingService.createFund(createGivingFundDto);
    }

    @Get('funds')
    findAllFunds() {
        return this.givingService.findAllFunds();
    }

    @Get('funds/:id')
    findOneFund(@Param('id') id: string) {
        return this.givingService.findOneFund(id);
    }

    @Patch('funds/:id')
    updateFund(
        @Param('id') id: string,
        @Body() updateGivingFundDto: UpdateGivingFundDto,
    ) {
        return this.givingService.updateFund(id, updateGivingFundDto);
    }

    @Delete('funds/:id')
    removeFund(@Param('id') id: string) {
        return this.givingService.removeFund(id);
    }

    // Donations
    @Post('donations')
    createDonation(@Body() createDonationDto: CreateDonationDto) {
        return this.givingService.createDonation(createDonationDto);
    }

    @Get('donations')
    findAllDonations() {
        return this.givingService.findAllDonations();
    }

    @Get('donations/member/:memberId')
    findDonationsByMember(@Param('memberId') memberId: string) {
        return this.givingService.findDonationsByMember(memberId);
    }

    // Payment Configs
    @Post('payment-configs')
    createPaymentConfig(@Body() dto: CreatePaymentConfigDto) {
        return this.givingService.createPaymentConfig(dto);
    }

    @Get('payment-configs')
    findAllPaymentConfigs() {
        return this.givingService.findAllPaymentConfigs();
    }

    // Add admin alias for admin web compatibility if needed
    @Get('payment-configs/admin')
    findAllPaymentConfigsAdmin() {
        return this.givingService.findAllPaymentConfigs();
    }

    @Delete('payment-configs/:id')
    removePaymentConfig(@Param('id') id: string) {
        return this.givingService.removePaymentConfig(id);
    }

    @Patch('payment-configs/:id')
    togglePaymentConfig(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.givingService.togglePaymentConfig(id, isActive);
    }
}
