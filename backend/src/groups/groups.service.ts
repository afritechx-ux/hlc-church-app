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
}
