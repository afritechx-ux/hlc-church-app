import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreateGivingFundDto } from './dto/create-giving-fund.dto';
import { UpdateGivingFundDto } from './dto/update-giving-fund.dto';
import { CreatePaymentConfigDto } from './dto/create-payment-config.dto';

@Injectable()
export class GivingService {
    constructor(private prisma: PrismaService) { }

    // Funds
    createFund(createGivingFundDto: CreateGivingFundDto) {
        return this.prisma.givingFund.create({
            data: createGivingFundDto,
        });
    }

    findAllFunds() {
        return this.prisma.givingFund.findMany();
    }

    findOneFund(id: string) {
        return this.prisma.givingFund.findUnique({
            where: { id },
        });
    }

    updateFund(id: string, updateGivingFundDto: UpdateGivingFundDto) {
        return this.prisma.givingFund.update({
            where: { id },
            data: updateGivingFundDto,
        });
    }

    removeFund(id: string) {
        return this.prisma.givingFund.delete({
            where: { id },
        });
    }

    // Donations
    createDonation(createDonationDto: CreateDonationDto) {
        return this.prisma.donation.create({
            data: {
                amount: createDonationDto.amount,
                fundId: createDonationDto.fundId,
                memberId: createDonationDto.memberId,
                method: (createDonationDto.method as any) || PaymentMethod.CASH,
            },
        });
    }

    findAllDonations() {
        return this.prisma.donation.findMany({
            include: {
                fund: true,
                member: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    findDonationsByMember(memberId: string) {
        return this.prisma.donation.findMany({
            where: { memberId },
            include: {
                fund: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    // Payment Configs
    createPaymentConfig(dto: CreatePaymentConfigDto) {
        return this.prisma.paymentConfig.create({
            data: dto,
        });
    }

    findAllPaymentConfigs() {
        return this.prisma.paymentConfig.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    removePaymentConfig(id: string) {
        return this.prisma.paymentConfig.delete({
            where: { id },
        });
    }

    togglePaymentConfig(id: string, isActive: boolean) {
        return this.prisma.paymentConfig.update({
            where: { id },
            data: { isActive },
        });
    }
}
