import { PartialType } from '@nestjs/swagger';
import { CreateGivingFundDto } from './create-giving-fund.dto';

export class UpdateGivingFundDto extends PartialType(CreateGivingFundDto) { }
