import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators';

@Controller('health')
export class HealthController {
    @Public()
    @Get()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            },
        };
    }

    @Public()
    @Get('ready')
    readiness() {
        return { status: 'ready' };
    }

    @Public()
    @Get('live')
    liveness() {
        return { status: 'live' };
    }
}
