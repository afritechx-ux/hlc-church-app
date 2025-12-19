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
                date: createDonationDto.date ? new Date(createDonationDto.date) : undefined,
                note: createDonationDto.note,
                reference: createDonationDto.reference,
                gateway: createDonationDto.gateway,
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

    updateDonation(id: string, dto: any) {
        const data: any = { ...dto };
        if (data.date) {
            data.date = new Date(data.date);
        }
        if (data.method) {
            data.method = data.method as PaymentMethod;
        }

        return this.prisma.donation.update({
            where: { id },
            data,
        });
    }

    removeDonation(id: string) {
        return this.prisma.donation.delete({
            where: { id },
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
    // Services
    async getAnalyticsOverview() {
        try {
            const totalDonations = await this.prisma.donation.aggregate({
                _sum: { amount: true },
            });

            const activeDonors = await this.prisma.donation.groupBy({
                by: ['memberId'],
                _count: { memberId: true },
            });

            // Calculate growth (this month vs last month)
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const thisMonth = await this.prisma.donation.aggregate({
                _sum: { amount: true },
                where: { date: { gte: startOfMonth } },
            });

            const lastMonth = await this.prisma.donation.aggregate({
                _sum: { amount: true },
                where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } },
            });

            const current = thisMonth._sum.amount ? thisMonth._sum.amount.toNumber() : 0;
            const previous = lastMonth._sum.amount ? lastMonth._sum.amount.toNumber() : 0;
            let growth = 0;
            if (previous > 0) {
                growth = ((current - previous) / previous) * 100;
            }

            return {
                totalAmount: totalDonations._sum.amount ? totalDonations._sum.amount.toNumber() : 0,
                activeDonors: activeDonors.length,
                monthlyGrowth: growth,
                thisMonthAmount: current,
            };
        } catch (error) {
            console.error('Error in getAnalyticsOverview:', error);
            throw error;
        }
    }

    async getDonationTrends() {
        try {
            // Daily trends for the last 30 days
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 30);

            const donations = await this.prisma.donation.findMany({
                where: { date: { gte: limitDate } },
                select: { date: true, amount: true },
                orderBy: { date: 'asc' },
            });

            // Group by day (YYYY-MM-DD)
            const dailyTrends: Record<string, number> = {};
            donations.forEach(d => {
                if (d.date && d.amount) {
                    const day = d.date.toISOString().split('T')[0];
                    const amount = d.amount.toNumber(); // Decimal to number
                    dailyTrends[day] = (dailyTrends[day] || 0) + amount;
                }
            });

            return Object.entries(dailyTrends).map(([date, amount]) => ({ date, amount }));
        } catch (error) {
            console.error('Error in getDonationTrends:', error);
            throw error;
        }
    }

    async getDonationsByFund() {
        try {
            const result = await this.prisma.donation.groupBy({
                by: ['fundId'],
                _sum: { amount: true },
            });

            // Fetch fund names
            const funds = await this.prisma.givingFund.findMany();
            const fundMap = new Map(funds.map(f => [f.id, f.name]));

            return result.map(item => ({
                name: fundMap.get(item.fundId) || 'Unknown Fund',
                amount: item._sum.amount ? item._sum.amount.toNumber() : 0,
            }));
        } catch (error) {
            console.error('Error in getDonationsByFund:', error);
            throw error;
        }
    }
}
