import { Injectable } from '@nestjs/common';
import { PaymentConfig, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentConfigService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.PaymentConfigCreateInput): Promise<PaymentConfig> {
        return this.prisma.paymentConfig.create({
            data,
        });
    }

    async findAll(): Promise<PaymentConfig[]> {
        return this.prisma.paymentConfig.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllAdmin(): Promise<PaymentConfig[]> {
        return this.prisma.paymentConfig.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string): Promise<PaymentConfig | null> {
        return this.prisma.paymentConfig.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Prisma.PaymentConfigUpdateInput): Promise<PaymentConfig> {
        return this.prisma.paymentConfig.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<PaymentConfig> {
        return this.prisma.paymentConfig.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async deletePermanent(id: string): Promise<PaymentConfig> {
        return this.prisma.paymentConfig.delete({
            where: { id },
        });
    }
}
