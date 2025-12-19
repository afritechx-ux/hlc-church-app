import { Module } from '@nestjs/common';
import { GivingService } from './giving.service';
import { GivingController } from './giving.controller';
import { PaymentConfigService } from './payment-config.service';
import { PaymentConfigController } from './payment-config.controller';

import { PaystackService } from './paystack.service';

@Module({
    controllers: [GivingController, PaymentConfigController],
    providers: [GivingService, PaymentConfigService, PaystackService],
    exports: [GivingService, PaystackService],
})
export class GivingModule { }
