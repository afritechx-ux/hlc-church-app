import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentConfig, PaymentMethod } from '@prisma/client';
import { PaymentConfigService } from './payment-config.service';

@Controller('giving/payment-configs')
export class PaymentConfigController {
    constructor(private readonly paymentConfigService: PaymentConfigService) { }

    @Post()
    create(@Body() data: any) {
        // Basic validation mapping
        return this.paymentConfigService.create({
            type: data.type as PaymentMethod,
            provider: data.provider,
            accountName: data.accountName,
            accountNumber: data.accountNumber,
            description: data.description,
            isActive: data.isActive ?? true,
        });
    }

    @Get()
    findAll() {
        return this.paymentConfigService.findAll();
    }

    @Get('admin')
    findAllAdmin() {
        return this.paymentConfigService.findAllAdmin();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.paymentConfigService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.paymentConfigService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.paymentConfigService.remove(id); // Soft delete
    }
}
