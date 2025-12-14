import { PartialType } from '@nestjs/swagger';
import { CreateServiceTemplateDto } from './create-service-template.dto';

export class UpdateServiceTemplateDto extends PartialType(CreateServiceTemplateDto) { }
