import { PartialType } from '@nestjs/swagger';
import { CreateServiceOccurrenceDto } from './create-service-occurrence.dto';

export class UpdateServiceOccurrenceDto extends PartialType(CreateServiceOccurrenceDto) { }
