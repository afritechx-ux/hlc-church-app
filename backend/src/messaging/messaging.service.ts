import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, CreateTemplateDto, UpdateTemplateDto } from './dto/messaging.dto';
import { MessageStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class MessagingService {
    private readonly logger = new Logger(MessagingService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
        private smsService: SmsService,
    ) { }

    // ============ MESSAGES ============

    async sendMessage(dto: CreateMessageDto, sentById: string) {
        // Get recipients based on recipientType
        let members: any[] = [];

        if (dto.recipientType === 'all') {
            members = await this.prisma.member.findMany({
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true }
            });
        } else if (dto.recipientType === 'department' && dto.departmentId) {
            const deptMembers = await this.prisma.departmentMember.findMany({
                where: { departmentId: dto.departmentId },
                include: {
                    member: {
                        select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true }
                    }
                }
            });
            members = deptMembers.map(dm => dm.member);
        } else if (dto.recipientType === 'individual' && dto.memberIds?.length) {
            members = await this.prisma.member.findMany({
                where: { id: { in: dto.memberIds } },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true }
            });
        } else if (dto.recipientType === 'birthday') {
            // Today's birthdays
            const today = new Date();
            const allMembers = await this.prisma.member.findMany({
                where: { dateOfBirth: { not: null } },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true, dateOfBirth: true }
            });
            members = allMembers.filter(m => {
                const dob = new Date(m.dateOfBirth!);
                return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
            });
        }

        if (members.length === 0) {
            return { message: 'No recipients found', recipientCount: 0 };
        }

        // Create the message record
        const message = await this.prisma.message.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                channel: dto.channel,
                type: dto.type || 'announcement',
                recipientType: dto.recipientType,
                departmentId: dto.departmentId,
                sentById,
                recipients: {
                    create: members.map(m => ({
                        memberId: m.id,
                        memberName: `${m.firstName} ${m.lastName}`,
                        memberEmail: m.email,
                        memberPhone: m.phone,
                        status: MessageStatus.PENDING,
                    }))
                }
            },
            include: {
                recipients: true
            }
        });

        // Process sending based on channel
        for (const recipient of message.recipients) {
            try {
                const member = members.find(m => m.id === recipient.memberId);
                const personalizedBody = dto.body
                    .replace(/{firstName}/g, member?.firstName || 'Member')
                    .replace(/{lastName}/g, member?.lastName || '');

                if (dto.channel === 'NOTIFICATION' && member?.userId) {
                    // Send in-app notification
                    await this.notificationsService.create({
                        userId: member.userId,
                        title: dto.subject,
                        message: personalizedBody,
                        type: 'info',
                    });
                } else if (dto.channel === 'EMAIL' && member?.email) {
                    const sent = await this.emailService.sendEmail(member.email, dto.subject, personalizedBody);
                    if (!sent) throw new Error('Failed to send email');
                } else if (dto.channel === 'SMS' && member?.phone) {
                    const sent = await this.smsService.sendSms(member.phone, personalizedBody);
                    if (!sent) throw new Error('Failed to send SMS');
                }

                // Mark as sent
                await this.prisma.messageRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: MessageStatus.SENT,
                        sentAt: new Date(),
                    }
                });

                this.logger.log(`Sent message to ${member?.firstName} ${member?.lastName} via ${dto.channel}`);
            } catch (error) {
                this.logger.error(`Failed to send to ${recipient.memberName}: ${error.message}`);
                await this.prisma.messageRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: MessageStatus.FAILED,
                        error: error.message,
                    }
                });
            }
        }

        return {
            id: message.id,
            recipientCount: members.length,
            message: `Message sent to ${members.length} recipient(s)`,
        };
    }

    async findAllMessages(sentById?: string) {
        return this.prisma.message.findMany({
            where: sentById ? { sentById } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                recipients: {
                    select: {
                        id: true,
                        memberName: true,
                        status: true,
                        sentAt: true,
                    }
                },
                _count: {
                    select: { recipients: true }
                }
            },
            take: 50,
        });
    }

    async findMessageById(id: string) {
        return this.prisma.message.findUnique({
            where: { id },
            include: {
                recipients: true,
            }
        });
    }

    // ============ BIRTHDAYS ============

    async getTodaysBirthdays() {
        const today = new Date();
        const allMembers = await this.prisma.member.findMany({
            where: { dateOfBirth: { not: null } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
            }
        });

        return allMembers.filter(m => {
            const dob = new Date(m.dateOfBirth!);
            return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
        });
    }

    async getUpcomingBirthdays(days: number = 7) {
        const today = new Date();
        const allMembers = await this.prisma.member.findMany({
            where: { dateOfBirth: { not: null } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                dateOfBirth: true,
            }
        });

        return allMembers.filter(m => {
            const dob = new Date(m.dateOfBirth!);
            const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            const diff = (thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diff > 0 && diff <= days;
        }).sort((a, b) => {
            const aDate = new Date(a.dateOfBirth!);
            const bDate = new Date(b.dateOfBirth!);
            return aDate.getMonth() - bDate.getMonth() || aDate.getDate() - bDate.getDate();
        });
    }

    // ============ TEMPLATES ============

    async createTemplate(dto: CreateTemplateDto) {
        return this.prisma.messageTemplate.create({
            data: {
                name: dto.name,
                type: dto.type,
                subject: dto.subject,
                body: dto.body,
                variables: dto.variables || ['firstName', 'lastName'],
            }
        });
    }

    async findAllTemplates() {
        return this.prisma.messageTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateTemplate(id: string, dto: UpdateTemplateDto) {
        return this.prisma.messageTemplate.update({
            where: { id },
            data: dto,
        });
    }

    async deleteTemplate(id: string) {
        return this.prisma.messageTemplate.delete({
            where: { id }
        });
    }

    // ============ SEED DEFAULT TEMPLATES ============

    async seedDefaultTemplates() {
        const existingCount = await this.prisma.messageTemplate.count();
        if (existingCount === 0) {
            const defaults = [
                {
                    name: 'Birthday Wishes',
                    type: 'birthday',
                    subject: '🎂 Happy Birthday!',
                    body: 'Dear {firstName},\n\nWishing you a wonderful birthday filled with joy and blessings! May this new year of your life bring you happiness, success, and God\'s abundant grace.\n\nWith love,\nHLAG Church Family',
                    variables: ['firstName', 'lastName'],
                },
                {
                    name: 'Welcome New Member',
                    type: 'welcome',
                    subject: '🙏 Welcome to HLAG Church!',
                    body: 'Dear {firstName},\n\nWe are thrilled to welcome you to our church family! Thank you for choosing to worship with us.\n\nBlessings,\nHLAG Church',
                    variables: ['firstName', 'lastName'],
                },
                {
                    name: 'Service Reminder',
                    type: 'reminder',
                    subject: '⛪ Sunday Service Reminder',
                    body: 'Dear {firstName},\n\nThis is a friendly reminder that our Sunday service is coming up!\n\nCome expecting a blessing!\n\nHLAG Church',
                    variables: ['firstName', 'lastName'],
                },
                {
                    name: 'General Announcement',
                    type: 'announcement',
                    subject: '📢 Important Announcement',
                    body: 'Dear {firstName},\n\n[Your announcement here]\n\nBlessings,\nHLAG Church',
                    variables: ['firstName', 'lastName'],
                },
            ];

            for (const template of defaults) {
                await this.prisma.messageTemplate.create({ data: template });
            }
            this.logger.log('Default message templates seeded');
        }
    }
}
