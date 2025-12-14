import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceTemplateDto } from './dto/create-service-template.dto';
import { UpdateServiceTemplateDto } from './dto/update-service-template.dto';
import { CreateServiceOccurrenceDto } from './dto/create-service-occurrence.dto';
import { UpdateServiceOccurrenceDto } from './dto/update-service-occurrence.dto';

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    // Templates
    createTemplate(createServiceTemplateDto: CreateServiceTemplateDto) {
        return this.prisma.serviceTemplate.create({
            data: createServiceTemplateDto,
        });
    }

    findAllTemplates() {
        return this.prisma.serviceTemplate.findMany();
    }

    findOneTemplate(id: string) {
        return this.prisma.serviceTemplate.findUnique({
            where: { id },
        });
    }

    updateTemplate(id: string, updateServiceTemplateDto: UpdateServiceTemplateDto) {
        return this.prisma.serviceTemplate.update({
            where: { id },
            data: updateServiceTemplateDto,
        });
    }

    removeTemplate(id: string) {
        return this.prisma.serviceTemplate.delete({
            where: { id },
        });
    }

    // Occurrences
    createOccurrence(createServiceOccurrenceDto: CreateServiceOccurrenceDto) {
        return this.prisma.serviceOccurrence.create({
            data: {
                templateId: createServiceOccurrenceDto.templateId,
                date: new Date(createServiceOccurrenceDto.date),
                startTime: new Date(createServiceOccurrenceDto.startTime),
                endTime: new Date(createServiceOccurrenceDto.endTime),
            },
        });
    }

    findAllOccurrences() {
        return this.prisma.serviceOccurrence.findMany({
            include: {
                template: true,
            },
            orderBy: {
                startTime: 'desc',
            },
        });
    }

    findOneOccurrence(id: string) {
        return this.prisma.serviceOccurrence.findUnique({
            where: { id },
            include: {
                template: true,
                attendance: true,
            },
        });
    }

    updateOccurrence(id: string, updateServiceOccurrenceDto: UpdateServiceOccurrenceDto) {
        const data: any = { ...updateServiceOccurrenceDto };
        if (data.date) data.date = new Date(data.date);
        if (data.startTime) data.startTime = new Date(data.startTime);
        if (data.endTime) data.endTime = new Date(data.endTime);

        return this.prisma.serviceOccurrence.update({
            where: { id },
            data,
        });
    }

    removeOccurrence(id: string) {
        return this.prisma.serviceOccurrence.delete({
            where: { id },
        });
    }
}
