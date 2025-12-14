import { PrismaClient, Role, GroupType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@hlag.com';
    const password = 'password123';
    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
            member: {
                create: {
                    firstName: 'Super',
                    lastName: 'Admin',
                    email: 'admin@hlag.com',
                    phone: '0000000000',
                }
            }
        },
    });

    console.log({ user });

    // Seed Groups
    const groups = [
        {
            name: 'Young Adults Fellowship',
            description: 'A vibrant community for young adults aged 18-35 to grow in faith together',
            type: GroupType.FELLOWSHIP,
            meetingDay: 'Friday',
            meetingTime: '18:30',
            location: 'Church Youth Center',
        },
        {
            name: 'Men\'s Bible Study',
            description: 'Weekly Bible study focused on godly manhood and leadership',
            type: GroupType.BIBLE_STUDY,
            meetingDay: 'Saturday',
            meetingTime: '07:00',
            location: 'Main Hall Room 201',
        },
        {
            name: 'Women\'s Prayer Circle',
            description: 'A supportive prayer group for women of all ages',
            type: GroupType.PRAYER_GROUP,
            meetingDay: 'Wednesday',
            meetingTime: '10:00',
            location: 'Prayer Room',
        },
        {
            name: 'Community Outreach Team',
            description: 'Serving the local community through various outreach programs',
            type: GroupType.OUTREACH,
            meetingDay: 'Saturday',
            meetingTime: '09:00',
            location: 'Community Center',
        },
        {
            name: 'Family Small Group',
            description: 'A small group for families to connect and grow together',
            type: GroupType.SMALL_GROUP,
            meetingDay: 'Thursday',
            meetingTime: '19:00',
            location: 'Various Homes',
        },
    ];

    for (const group of groups) {
        try {
            await prisma.group.create({
                data: group,
            });
        } catch (e) {
            // Group likely already exists, skip
        }
    }

    console.log('Groups seeded:', groups.length);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

