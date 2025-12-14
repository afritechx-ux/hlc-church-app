import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    create(createDepartmentDto: CreateDepartmentDto) {
        return this.prisma.department.create({
            data: createDepartmentDto,
        });
    }

    findAll() {
        return this.prisma.department.findMany({
            include: {
                members: {
                    include: {
                        member: true,
                    },
                },
            },
        });
    }

    findOne(id: string) {
        return this.prisma.department.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        member: true,
                    },
                },
            },
        });
    }

    update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
        return this.prisma.department.update({
            where: { id },
            data: updateDepartmentDto,
        });
    }

    remove(id: string) {
        return this.prisma.department.delete({
            where: { id },
        });
    }

    async addMember(departmentId: string, memberId: string, role?: string) {
        return this.prisma.departmentMember.create({
            data: {
                departmentId,
                memberId,
                role,
            },
        });
    }

    async removeMember(departmentId: string, memberId: string) {
        return this.prisma.departmentMember.deleteMany({
            where: {
                departmentId,
                memberId,
            },
        });
    }
}
