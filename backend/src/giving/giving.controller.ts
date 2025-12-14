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
}
