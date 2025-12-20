import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.group.findMany({
            where: { isActive: true },
            include: {
                members: {
                    include: {
                        // We'll denormalize member data
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findAllWithMembers() {
        const groups = await this.prisma.group.findMany({
            where: { isActive: true },
            include: {
                members: true,
            },
            orderBy: { name: 'asc' },
        });

        // Get all member IDs
        const memberIds = new Set<string>();
        groups.forEach(g => g.members.forEach(m => memberIds.add(m.memberId)));

        // Fetch member details
        const members = await this.prisma.member.findMany({
            where: { id: { in: Array.from(memberIds) } },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        const memberMap = new Map(members.map(m => [m.id, m]));

        // Enrich groups with member data
        return groups.map(group => ({
            ...group,
            memberCount: group.members.length,
            members: group.members.map(gm => ({
                ...gm,
                member: memberMap.get(gm.memberId),
            })),
        }));
    }

    async findOne(id: string) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                members: true,
            },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Fetch member details
        const memberIds = group.members.map(m => m.memberId);
        const members = await this.prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        });

        const memberMap = new Map(members.map(m => [m.id, m]));

        return {
            ...group,
            memberCount: group.members.length,
            members: group.members.map(gm => ({
                ...gm,
                member: memberMap.get(gm.memberId),
            })),
        };
    }

    async findByMember(memberId: string) {
        const groupMembers = await this.prisma.groupMember.findMany({
            where: { memberId },
            include: {
                group: true,
            },
        });

        return groupMembers.map(gm => gm.group);
    }

    async create(dto: CreateGroupDto) {
        return this.prisma.group.create({
            data: dto,
        });
    }

    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Soft delete by marking as inactive
        return this.prisma.group.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async addMember(groupId: string, dto: AddMemberDto) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Check if member exists
        const member = await this.prisma.member.findUnique({ where: { id: dto.memberId } });
        if (!member) {
            throw new NotFoundException('Member not found');
        }

        // Check if already a member
        const existing = await this.prisma.groupMember.findUnique({
            where: {
                groupId_memberId: { groupId, memberId: dto.memberId },
            },
        });

        if (existing) {
            throw new ConflictException('Member is already in this group');
        }

        return this.prisma.groupMember.create({
            data: {
                groupId,
                memberId: dto.memberId,
                role: dto.role || 'MEMBER',
            },
        });
    }

    async removeMember(groupId: string, memberId: string) {
        const groupMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_memberId: { groupId, memberId },
            },
        });

        if (!groupMember) {
            throw new NotFoundException('Member is not in this group');
        }

        return this.prisma.groupMember.delete({
            where: { id: groupMember.id },
        });
    }

    async updateMemberRole(groupId: string, memberId: string, role: string) {
        const groupMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_memberId: { groupId, memberId },
            },
        });

        if (!groupMember) {
            throw new NotFoundException('Member is not in this group');
        }

        return this.prisma.groupMember.update({
            where: { id: groupMember.id },
            data: { role },
        });
    }

    // ======== ENTERPRISE FEATURES ========

    async getAnalytics(groupId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Get member join dates for growth analysis
        const members = await this.prisma.groupMember.findMany({
            where: { groupId },
            orderBy: { joinedAt: 'asc' },
        });

        // Calculate monthly growth (last 6 months)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyGrowth: { month: string; count: number }[] = [];

        for (let i = 0; i < 6; i++) {
            const monthStart = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            const count = members.filter(m => {
                const joinDate = new Date(m.joinedAt);
                return joinDate >= monthStart && joinDate <= monthEnd;
            }).length;
            monthlyGrowth.push({
                month: monthStart.toLocaleString('default', { month: 'short', year: '2-digit' }),
                count,
            });
        }

        // Role distribution
        const roleDistribution = members.reduce((acc, m) => {
            acc[m.role] = (acc[m.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalMembers: members.length,
            monthlyGrowth,
            roleDistribution,
            createdAt: group.createdAt,
            lastActivity: members.length > 0 ? members[members.length - 1].joinedAt : null,
        };
    }

    async getActivity(groupId: string, limit = 20) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Get recent member joins
        const recentJoins = await this.prisma.groupMember.findMany({
            where: { groupId },
            orderBy: { joinedAt: 'desc' },
            take: limit,
        });

        const memberIds = recentJoins.map(m => m.memberId);
        const members = await this.prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        const memberMap = new Map(members.map(m => [m.id, m]));

        return recentJoins.map(join => ({
            type: 'MEMBER_JOINED',
            timestamp: join.joinedAt,
            member: memberMap.get(join.memberId),
            role: join.role,
        }));
    }

    async generateInviteCode(groupId: string) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Generate a simple invite code (in production, store this in DB with expiry)
        const code = `${groupId.slice(0, 8)}-${Date.now().toString(36)}`;
        return { inviteCode: code, groupId, groupName: group.name };
    }

    async sendAnnouncement(groupId: string, title: string, message: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Get all member IDs
        const memberIds = group.members.map(m => m.memberId);

        // Get user IDs for these members
        const members = await this.prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { userId: true },
        });

        const userIds = members.filter(m => m.userId).map(m => m.userId as string);

        // Create notifications for all users
        const notifications = userIds.map(userId => ({
            userId,
            title: `[${group.name}] ${title}`,
            message,
            type: 'GROUP_ANNOUNCEMENT',
        }));

        if (notifications.length > 0) {
            await this.prisma.notification.createMany({ data: notifications });
        }

        return {
            success: true,
            recipientCount: notifications.length,
            groupName: group.name,
        };
    }
}
