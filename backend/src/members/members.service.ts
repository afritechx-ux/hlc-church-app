import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import * as argon from 'argon2';

@Injectable()
export class MembersService {
    constructor(private prisma: PrismaService) { }

    async create(createMemberDto: CreateMemberDto) {
        const { createUserAccount, password, ...memberData } = createMemberDto;

        // If creating user account, email is required
        if (createUserAccount && !memberData.email) {
            throw new BadRequestException('Email is required to create a user account');
        }

        // Check if email already exists as a user
        if (createUserAccount && memberData.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: memberData.email },
            });
            if (existingUser) {
                throw new BadRequestException('A user with this email already exists');
            }
        }

        // Create member with optional user account
        if (createUserAccount && memberData.email) {
            const defaultPassword = password || 'password123';
            const hashedPassword = await argon.hash(defaultPassword);

            // Create user with linked member in a transaction
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: memberData.email!,
                        password: hashedPassword,
                        role: 'MEMBER',
                        member: {
                            create: {
                                ...memberData,
                                dateOfBirth: memberData.dateOfBirth ? new Date(memberData.dateOfBirth) : undefined,
                            },
                        },
                    },
                    include: {
                        member: true,
                    },
                });

                return user.member;
            });

            return result;
        }

        // Create member without user account
        return this.prisma.member.create({
            data: {
                ...memberData,
                dateOfBirth: memberData.dateOfBirth ? new Date(memberData.dateOfBirth) : undefined,
            },
        });
    }

    findAll() {
        return this.prisma.member.findMany({
            include: {
                household: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    findOne(id: string) {
        return this.prisma.member.findUnique({
            where: { id },
            include: {
                household: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                departments: {
                    include: {
                        department: true,
                    },
                },
            },
        });
    }

    update(id: string, updateMemberDto: UpdateMemberDto) {
        return this.prisma.member.update({
            where: { id },
            data: {
                ...updateMemberDto,
                dateOfBirth: updateMemberDto.dateOfBirth ? new Date(updateMemberDto.dateOfBirth) : undefined,
            },
        });
    }

    remove(id: string) {
        return this.prisma.member.delete({
            where: { id },
        });
    }
}

