import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { HouseholdsService } from './households.service';

@Controller('households')
export class HouseholdsController {
    constructor(private readonly householdsService: HouseholdsService) { }

    @Post()
    create(@Body() createHouseholdDto: CreateHouseholdDto) {
        return this.householdsService.create(createHouseholdDto);
    }

    @Get()
    findAll() {
        return this.householdsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.householdsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateHouseholdDto: UpdateHouseholdDto) {
        return this.householdsService.update(id, updateHouseholdDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.householdsService.remove(id);
    }
}
