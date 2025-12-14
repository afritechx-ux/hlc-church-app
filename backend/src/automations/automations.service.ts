import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FollowUpType } from '@prisma/client';
import { EngagementService } from '../engagement/engagement.service';
import { FollowUpsService } from '../follow-ups/follow-ups.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationsService {
    private readonly logger = new Logger(AutomationsService.name);

    constructor(
        private prisma: PrismaService,
        private engagementService: EngagementService,
        private followUpsService: FollowUpsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleNightlyScoring() {
        this.logger.log('Running nightly engagement scoring...');
        await this.engagementService.calculateAllScores();
        this.logger.log('Nightly engagement scoring complete.');
    }

    @Cron(CronExpression.EVERY_WEEK)
    async handleInactiveMemberDetection() {
        this.logger.log('Running inactive member detection...');
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        // Find members with no attendance in last 4 weeks
        // This is a simplified check. In production, we'd use raw SQL or more complex filtering
        // to exclude members who HAVE attended recently.

        // 1. Get all members
        const allMembers = await this.prisma.member.findMany({
            select: { id: true }
        });

        for (const member of allMembers) {
            const recentAttendance = await this.prisma.attendanceRecord.findFirst({
                where: {
                    memberId: member.id,
                    checkInTime: {
                        gte: fourWeeksAgo
                    }
                }
            });

            if (!recentAttendance) {
                // Check if task already exists
                const existingTask = await this.prisma.followUpTask.findFirst({
                    where: {
                        memberId: member.id,
                        type: FollowUpType.INACTIVE_MEMBER,
                        status: 'OPEN'
                    }
                });

                if (!existingTask) {
                    await this.followUpsService.create({
                        type: FollowUpType.INACTIVE_MEMBER,
                        memberId: member.id,
                        notes: 'Automatically detected inactive member (no attendance in 4 weeks).',
                    });
                    this.logger.log(`Created inactive member task for ${member.id}`);
                }
            }
        }

        this.logger.log('Inactive member detection complete.');
    }

    @Cron(CronExpression.EVERY_WEEKEND) // Simplified for demo, ideally Saturday evening
    async handleServiceReminders() {
        this.logger.log('Running service reminders...');
        // In a real app, we would:
        // 1. Find the next service occurrence (e.g., tomorrow)
        // 2. Find all active members (or those with push tokens)
        // 3. Send push notifications via Expo SDK (or queue them)

        // For now, we'll just log it as a placeholder for the "Notifications" feature integration
        this.logger.log('Sending reminders for upcoming Sunday service...');

        // Mock sending to 5 random members
        const members = await this.prisma.member.findMany({ take: 5 });
        for (const member of members) {
            this.logger.log(`[Mock] Sent reminder to ${member.firstName} ${member.lastName}`);
        }

        this.logger.log('Service reminders complete.');
    }

    async triggerNewVisitorPipeline(memberId: string) {
        // 1. Welcome Task
        await this.followUpsService.create({
            type: FollowUpType.NEW_VISITOR,
            memberId,
            notes: 'Step 1: Send Welcome Message',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 Day
        });

        // 2. Call Task
        await this.followUpsService.create({
            type: FollowUpType.NEW_VISITOR,
            memberId,
            notes: 'Step 2: Initial Phone Call',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 Days
        });
    }
}
