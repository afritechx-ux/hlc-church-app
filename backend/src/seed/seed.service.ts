import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, GroupType } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        await this.seedAdminUser();
        await this.seedGroups();
    }

    private async seedAdminUser() {
        const email = 'admin@hlag.com';
        const password = 'password123';

        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                this.logger.log('Admin user already exists, skipping seed');
                return;
            }

            const hashedPassword = await argon2.hash(password);

            await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: Role.SUPER_ADMIN,
                    member: {
                        create: {
                            firstName: 'Super',
                            lastName: 'Admin',
                            email: 'admin@hlag.com',
                            phone: '0000000000',
                        },
                    },
                },
            });

            this.logger.log('✅ Admin user created: admin@hlag.com / password123');
        } catch (error) {
            this.logger.error('Failed to seed admin user:', error);
        }
    }

    private async seedGroups() {
        const groups = [
            {
                name: 'Young Adults Fellowship',
                description: 'A vibrant community for young adults aged 18-35',
                type: GroupType.FELLOWSHIP,
                meetingDay: 'Friday',
                meetingTime: '18:30',
                location: 'Church Youth Center',
            },
            {
                name: "Men's Bible Study",
                description: 'Weekly Bible study focused on godly manhood',
                type: GroupType.BIBLE_STUDY,
                meetingDay: 'Saturday',
                meetingTime: '07:00',
                location: 'Main Hall Room 201',
            },
            {
                name: "Women's Prayer Circle",
                description: 'A supportive prayer group for women',
                type: GroupType.PRAYER_GROUP,
                meetingDay: 'Wednesday',
                meetingTime: '10:00',
                location: 'Prayer Room',
            },
        ];

        for (const group of groups) {
            try {
                const existing = await this.prisma.group.findFirst({
                    where: { name: group.name },
                });

                if (!existing) {
                    await this.prisma.group.create({ data: group });
                    this.logger.log(`✅ Created group: ${group.name}`);
                }
            } catch (error) {
                // Skip if exists
            }
        }
    }
}
