import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async generateAttendanceCsv(startDate: string, endDate: string): Promise<string> {
        const records = await this.prisma.attendanceRecord.findMany({
            where: {
                checkInTime: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                member: true,
                serviceOccurrence: {
                    include: { template: true },
                },
            },
            orderBy: { checkInTime: 'desc' },
        });

        const headers = ['Date', 'Service', 'Member Name', 'Email', 'Phone', 'Check-In Time', 'Method'];
        const rows = records.map(r => [
            new Date(r.serviceOccurrence.date).toLocaleDateString(),
            r.serviceOccurrence.template.name,
            `${r.member.firstName} ${r.member.lastName}`,
            r.member.email || '',
            r.member.phone || '',
            new Date(r.checkInTime).toLocaleTimeString(),
            r.method,
        ]);

        return this.toCsv(headers, rows);
    }

    async generateGivingCsv(startDate: string, endDate: string): Promise<string> {
        const donations = await this.prisma.donation.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                member: true,
                fund: true,
            },
            orderBy: { date: 'desc' },
        });

        const headers = ['Date', 'Fund', 'Amount (GHS)', 'Method', 'Donor Name', 'Email'];
        const rows = donations.map(d => [
            new Date(d.date).toLocaleDateString(),
            d.fund.name,
            d.amount.toString(),
            d.method,
            d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonymous',
            d.member?.email || '',
        ]);

        return this.toCsv(headers, rows);
    }

    async generateMembersCsv(): Promise<string> {
        const members = await this.prisma.member.findMany({
            include: {
                household: true,
                departments: {
                    include: { department: true },
                },
            },
            orderBy: { lastName: 'asc' },
        });

        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'DOB', 'Gender', 'Household', 'Departments'];
        const rows = members.map(m => [
            m.firstName,
            m.lastName,
            m.email || '',
            m.phone || '',
            m.address || '',
            m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : '',
            m.gender || '',
            m.household?.name || '',
            m.departments.map(d => d.department.name).join('; '),
        ]);

        return this.toCsv(headers, rows);
    }

    async getSummaryStats(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const [totalMembers, newMembers, totalAttendance, totalGiving, donations] = await Promise.all([
            this.prisma.member.count(),
            this.prisma.member.count({
                where: { createdAt: { gte: start, lte: end } },
            }),
            this.prisma.attendanceRecord.count({
                where: { checkInTime: { gte: start, lte: end } },
            }),
            this.prisma.donation.aggregate({
                _sum: { amount: true },
                where: { date: { gte: start, lte: end } },
            }),
            this.prisma.donation.count({
                where: { date: { gte: start, lte: end } },
            }),
        ]);

        return {
            period: { startDate, endDate },
            members: {
                total: totalMembers,
                newThisPeriod: newMembers,
            },
            attendance: {
                totalCheckIns: totalAttendance,
            },
            giving: {
                totalAmount: totalGiving._sum.amount || 0,
                totalDonations: donations,
            },
        };
    }

    private toCsv(headers: string[], rows: string[][]): string {
        const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
        const headerLine = headers.map(escape).join(',');
        const dataLines = rows.map(row => row.map(escape).join(','));
        return [headerLine, ...dataLines].join('\n');
    }
}
