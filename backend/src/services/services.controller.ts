import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceTemplateDto } from './dto/create-service-template.dto';
import { UpdateServiceTemplateDto } from './dto/update-service-template.dto';
import { CreateServiceOccurrenceDto } from './dto/create-service-occurrence.dto';
import { UpdateServiceOccurrenceDto } from './dto/update-service-occurrence.dto';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    // Templates
    @Post('templates')
    createTemplate(@Body() createServiceTemplateDto: CreateServiceTemplateDto) {
        return this.servicesService.createTemplate(createServiceTemplateDto);
    }

    @Get('templates')
    findAllTemplates() {
        return this.servicesService.findAllTemplates();
    }

    @Get('templates/:id')
    findOneTemplate(@Param('id') id: string) {
        return this.servicesService.findOneTemplate(id);
    }

    @Patch('templates/:id')
    updateTemplate(
        @Param('id') id: string,
        @Body() updateServiceTemplateDto: UpdateServiceTemplateDto,
    ) {
        return this.servicesService.updateTemplate(id, updateServiceTemplateDto);
    }

    @Delete('templates/:id')
    removeTemplate(@Param('id') id: string) {
        return this.servicesService.removeTemplate(id);
    }

    // Occurrences
    @Post('occurrences')
    createOccurrence(@Body() createServiceOccurrenceDto: CreateServiceOccurrenceDto) {
        return this.servicesService.createOccurrence(createServiceOccurrenceDto);
    }

    @Get('occurrences')
    findAllOccurrences() {
        return this.servicesService.findAllOccurrences();
    }

    @Get('occurrences/:id')
    findOneOccurrence(@Param('id') id: string) {
        return this.servicesService.findOneOccurrence(id);
    }

    @Patch('occurrences/:id')
    updateOccurrence(
        @Param('id') id: string,
        @Body() updateServiceOccurrenceDto: UpdateServiceOccurrenceDto,
    ) {
        return this.servicesService.updateOccurrence(id, updateServiceOccurrenceDto);
    }

    @Delete('occurrences/:id')
    removeOccurrence(@Param('id') id: string) {
        return this.servicesService.removeOccurrence(id);
    }
}
