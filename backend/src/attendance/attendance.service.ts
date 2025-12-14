import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AttendanceMethod } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class AttendanceService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    // --- QR Token Logic ---

    generateQRToken(serviceOccurrenceId: string) {
        const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
        const nonce = crypto.randomBytes(16).toString('hex');
        const exp = Date.now() + 60 * 1000; // 60 seconds from now

        const payload = {
            type: 'HLAG_ATTEND',
            serviceOccurrenceId,
            exp,
            nonce,
        };

        const data = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');

        return {
            payload,
            signature,
            token: Buffer.from(JSON.stringify({ payload, signature })).toString(
                'base64',
            ),
        };
    }

    async validateQRToken(token: string) {
        const secret = this.configService.get<string>('JWT_SECRET') || 'secret';

        try {
            const decoded = JSON.parse(
                Buffer.from(token, 'base64').toString('utf-8'),
            );
            const { payload, signature } = decoded;

            // 1. Verify Signature
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            if (signature !== expectedSignature) {
                throw new UnauthorizedException('Invalid token signature');
            }

            // 2. Verify Expiration
            if (Date.now() > payload.exp) {
                throw new UnauthorizedException('Token expired');
            }

            // 3. Verify Nonce (Replay Protection)
            const existingNonce = await this.prisma.qRTokenUsage.findUnique({
                where: { nonce: payload.nonce },
            });

            if (existingNonce) {
                throw new UnauthorizedException('Token already used');
            }

            // 4. Mark Nonce as Used
            await this.prisma.qRTokenUsage.create({
                data: {
                    nonce: payload.nonce,
                    expiresAt: new Date(payload.exp),
                },
            });

            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid QR token');
        }
    }

    // --- Attendance Logic ---

    async checkIn(checkInDto: CheckInDto) {
        const { memberId, serviceOccurrenceId, method } = checkInDto;

        // Check if already checked in
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: {
                memberId_serviceOccurrenceId: {
                    memberId,
                    serviceOccurrenceId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Member already checked in');
        }

        return this.prisma.attendanceRecord.create({
            data: {
                memberId,
                serviceOccurrenceId,
                method: method || AttendanceMethod.MANUAL,
            },
        });
    }

    async qrCheckIn(userId: string, token: string) {
        // 1. Validate Token
        const payload = await this.validateQRToken(token);

        // 2. Get Member ID from User ID
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { member: true },
        });

        if (!user || !user.member) {
            throw new BadRequestException('User is not linked to a member profile');
        }

        // 3. Perform Check-In
        return this.checkIn({
            memberId: user.member.id,
            serviceOccurrenceId: payload.serviceOccurrenceId,
            method: AttendanceMethod.QR,
        });
    }

    async getAttendanceByOccurrence(occurrenceId: string) {
        return this.prisma.attendanceRecord.findMany({
            where: { serviceOccurrenceId: occurrenceId },
            include: { member: true },
        });
    }

    async getAttendanceByMember(memberId: string) {
        return this.prisma.attendanceRecord.findMany({
            where: { memberId },
            include: { serviceOccurrence: true },
            orderBy: { checkInTime: 'desc' },
        });
    }

    async calculateStreak(memberId: string) {
        const attendance = await this.prisma.attendanceRecord.findMany({
            where: { memberId },
            include: { serviceOccurrence: true },
            orderBy: { serviceOccurrence: { startTime: 'desc' } },
        });

        if (attendance.length === 0) return 0;

        // Simplified streak logic placeholder
        return attendance.length;
    }
}
