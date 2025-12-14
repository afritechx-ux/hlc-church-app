import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EngagementService {
    constructor(private prisma: PrismaService) { }

    async calculateScore(memberId: string) {
        // 1. Attendance Score (Last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const attendanceCount = await this.prisma.attendanceRecord.count({
            where: {
                memberId,
                checkInTime: {
                    gte: threeMonthsAgo,
                },
            },
        });

        // Simple heuristic: 1 point per attendance, max 50
        const attendanceScore = Math.min(attendanceCount * 5, 50);

        // 2. Serving Score (Departments)
        const departmentCount = await this.prisma.departmentMember.count({
            where: { memberId },
        });
        const servingScore = Math.min(departmentCount * 10, 30);

        // 3. Giving Score (Any donation in last 3 months)
        const donationCount = await this.prisma.donation.count({
            where: {
                memberId,
                date: {
                    gte: threeMonthsAgo,
                },
            },
        });
        const givingScore = donationCount > 0 ? 20 : 0;

        // Total
        const totalScore = attendanceScore + servingScore + givingScore;

        // Update or Create Score
        return this.prisma.memberEngagementScore.upsert({
            where: { memberId },
            update: {
                attendanceScore,
                servingScore,
                givingScore,
                lastCalculatedAt: new Date(),
            },
            create: {
                memberId,
                attendanceScore,
                servingScore,
                givingScore,
            },
        });
    }

    async getScore(memberId: string) {
        return this.prisma.memberEngagementScore.findUnique({
            where: { memberId },
        });
    }

    async calculateAllScores() {
        const members = await this.prisma.member.findMany({
            select: { id: true },
        });

        for (const member of members) {
            await this.calculateScore(member.id);
        }
    }
}
