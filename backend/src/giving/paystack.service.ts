import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
    private readonly logger = new Logger(PaystackService.name);
    private readonly secretKey: string;

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || 'sk_test_demo';
    }

    async verifyTransaction(reference: string) {
        try {
            const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                this.logger.error(`Verification failed for reference: ${reference}`);
                return null;
            }

            const data = await response.json();
            return data.status === true ? data.data : null;
        } catch (error) {
            this.logger.error('Error verifying transaction', error);
            return null;
        }
    }
}
