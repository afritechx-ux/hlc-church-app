import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpTaskDto } from './dto/create-follow-up-task.dto';
import { UpdateFollowUpTaskDto } from './dto/update-follow-up-task.dto';

@Injectable()
export class FollowUpsService {
    constructor(private prisma: PrismaService) { }

    create(createFollowUpTaskDto: CreateFollowUpTaskDto) {
        return this.prisma.followUpTask.create({
            data: {
                type: createFollowUpTaskDto.type,
                memberId: createFollowUpTaskDto.memberId,
                assigneeId: createFollowUpTaskDto.assigneeId,
                dueDate: createFollowUpTaskDto.dueDate ? new Date(createFollowUpTaskDto.dueDate) : undefined,
                notes: createFollowUpTaskDto.notes,
            },
        });
    }

    findAll() {
        return this.prisma.followUpTask.findMany({
            include: {
                member: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    findOne(id: string) {
        return this.prisma.followUpTask.findUnique({
            where: { id },
            include: {
                member: true,
            },
        });
    }

    update(id: string, updateFollowUpTaskDto: UpdateFollowUpTaskDto) {
        const data: any = { ...updateFollowUpTaskDto };
        if (data.dueDate) {
            data.dueDate = new Date(data.dueDate);
        }
        return this.prisma.followUpTask.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.followUpTask.delete({
            where: { id },
        });
    }
}
