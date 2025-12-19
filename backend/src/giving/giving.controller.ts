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
import { UpdateDonationDto } from './dto/update-donation.dto';
import { GivingService } from './giving.service';
import { PaystackService } from './paystack.service';

@Controller('giving')
export class GivingController {
    constructor(
        private readonly givingService: GivingService,
        private readonly paystackService: PaystackService,
    ) { }

    // Funds
    @Post('funds')
    createFund(@Body() createGivingFundDto: CreateGivingFundDto) {
        console.log('Backend received createFund request:', createGivingFundDto);
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

    @Patch('donations/:id')
    updateDonation(@Param('id') id: string, @Body() updateDonationDto: UpdateDonationDto) {
        return this.givingService.updateDonation(id, updateDonationDto);
    }

    @Delete('donations/:id')
    removeDonation(@Param('id') id: string) {
        return this.givingService.removeDonation(id);
    }

    @Get('donations/member/:memberId')
    findDonationsByMember(@Param('memberId') memberId: string) {
        return this.givingService.findDonationsByMember(memberId);
    }

    // Payment Configs - MOVED TO payment-config.controller.ts
    // @Post('payment-configs')
    // createPaymentConfig(@Body() dto: CreatePaymentConfigDto) {
    //     return this.givingService.createPaymentConfig(dto);
    // }

    // @Get('payment-configs')
    // findAllPaymentConfigs() {
    //     return this.givingService.findAllPaymentConfigs();
    // }

    // @Get('payment-configs/admin')
    // findAllPaymentConfigsAdmin() {
    //     return this.givingService.findAllPaymentConfigs();
    // }

    // @Delete('payment-configs/:id')
    // removePaymentConfig(@Param('id') id: string) {
    //     return this.givingService.removePaymentConfig(id);
    // }

    // @Patch('payment-configs/:id')
    // togglePaymentConfig(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    //     return this.givingService.togglePaymentConfig(id, isActive);
    // }

    // Analytics
    @Get('analytics/overview')
    getAnalyticsOverview() {
        return this.givingService.getAnalyticsOverview();
    }

    @Get('analytics/trends')
    getDonationTrends() {
        return this.givingService.getDonationTrends();
    }

    @Get('analytics/by-fund')
    getDonationsByFund() {
        return this.givingService.getDonationsByFund();
    }

    // Webhooks
    @Post('webhook/paystack')
    async handlePaystackWebhook(@Body() payload: any) {
        if (payload.event === 'charge.success') {
            const { reference, amount, metadata } = payload.data;
            const verified = await this.paystackService.verifyTransaction(reference);

            if (verified && verified.status === 'success') {
                await this.givingService.createDonation({
                    amount: amount / 100,
                    fundId: metadata?.fundId,
                    memberId: metadata?.memberId,
                    method: 'CARD' as any,
                    reference,
                    gateway: 'PAYSTACK',
                });
                console.log('Paystack donation recorded:', reference);
            }
        }
        return { status: 'success' };
    }
}
