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
        return this.createToken(serviceOccurrenceId, 60 * 1000); // 60 seconds
    }

    generateStaticQRToken(serviceOccurrenceId: string) {
        return this.createToken(serviceOccurrenceId, 24 * 60 * 60 * 1000); // 24 hours
    }

    private createToken(serviceOccurrenceId: string, expiresInMs: number) {
        const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
        const nonce = crypto.randomBytes(16).toString('hex');
        const exp = Date.now() + expiresInMs;

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

            // 3. Verify Nonce (Replay Protection) - DISABLED for multi-user/public QR
            /*
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
            */

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

    // --- Public Check-In Logic ---

    async publicCheckIn(data: { token: string; name: string; phone: string; category: string; notes?: string }) {
        // 1. Validate Token (get serviceOccurrenceId)
        // We relax the nonce check for public check-in because multiple people might scan the same code on a screen
        // Validating signature and expiration is key.
        // Actually, if we use the same validateQRToken logic, it checks nonce.
        // For public kiosk display, we might need a "static" token or one that regenerates.
        // But the user said "scan it with their camera".
        // Let's assume the existing validateQRToken is fine if the QR code refreshes every 55s.
        // If 100 people scan it in 55s, the nonce is "used" by the first person?
        // YES. validateQRToken checks nonce usage.
        // ISSUE: If the QR code is on a screen and 50 people scan it, only the first succeeds if we strictly enforce nonce.
        // FIX: For public check-in, we should probably allow re-using the nonce OR the frontend must generate unique nonces per user? No, it's a broadcast.
        // We will make a `validatePublicQRToken` that skips nonce check.

        const payload = await this.validatePublicQRToken(data.token);

        let memberId: string | null = null;
        let finalCategory = data.category;

        // 2. Try to link to Member if category is MEMBER
        if (data.category === 'MEMBER' && data.phone) {
            // Normalize phone? For now exact match
            const member = await this.prisma.member.findFirst({
                where: { OR: [{ phone: data.phone }, { user: { email: data.phone } }] } // Basic fuzzy
            });
            if (member) {
                memberId = member.id;
            } else {
                finalCategory = 'VISITOR'; // Fallback or Keep MEMBER but allow null memberId?
                // Let's keep data.category but store as visitor fields
                // Actually, let's append to notes
                data.notes = (data.notes || '') + ' [Claimed Member not found]';
            }
        }

        // 3. Check for existing check-in to prevent double submission
        if (memberId) {
            const existing = await this.prisma.attendanceRecord.findUnique({
                where: {
                    memberId_serviceOccurrenceId: {
                        memberId,
                        serviceOccurrenceId: payload.serviceOccurrenceId,
                    },
                },
            });
            if (existing) return existing;
        }

        // 4. Create Record
        return this.prisma.attendanceRecord.create({
            data: {
                memberId,
                serviceOccurrenceId: payload.serviceOccurrenceId,
                method: AttendanceMethod.MANUAL, // or create a NEW ENUM 'PUBLIC_FORM'; using MANUAL for now
                visitorName: data.name,
                visitorPhone: data.phone,
                category: finalCategory,
                notes: data.notes,
            },
        });
    }

    async validatePublicQRToken(token: string) {
        const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
            const { payload, signature } = decoded;

            // Verify Signature
            const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
            if (signature !== expectedSignature) throw new UnauthorizedException('Invalid token signature');

            // Verify Expiration
            if (Date.now() > payload.exp) throw new UnauthorizedException('Token expired');

            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid QR token');
        }
    }

    async linkToMember(attendanceId: string, memberId: string) {
        // Verify the attendance record exists
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id: attendanceId },
        });

        if (!record) {
            throw new BadRequestException('Attendance record not found');
        }

        // Verify the member exists
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });

        if (!member) {
            throw new BadRequestException('Member not found');
        }

        // Check if this member already has an attendance record for this service
        const existing = await this.prisma.attendanceRecord.findUnique({
            where: {
                memberId_serviceOccurrenceId: {
                    memberId,
                    serviceOccurrenceId: record.serviceOccurrenceId,
                },
            },
        });

        if (existing && existing.id !== attendanceId) {
            throw new BadRequestException('This member is already checked in to this service');
        }

        // Update the attendance record to link it to the member
        return this.prisma.attendanceRecord.update({
            where: { id: attendanceId },
            data: {
                memberId,
                // Keep visitor info but clear the "not found" note
                notes: record.notes?.replace('[Claimed Member not found]', '[Linked by admin]') || '[Linked by admin]',
            },
            include: { member: true },
        });
    }
}
