import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateFollowUpTaskDto } from './dto/create-follow-up-task.dto';
import { UpdateFollowUpTaskDto } from './dto/update-follow-up-task.dto';
import { FollowUpsService } from './follow-ups.service';

@Controller('follow-ups')
export class FollowUpsController {
    constructor(private readonly followUpsService: FollowUpsService) { }

    @Post()
    create(@Body() createFollowUpTaskDto: CreateFollowUpTaskDto) {
        return this.followUpsService.create(createFollowUpTaskDto);
    }

    @Get()
    findAll() {
        return this.followUpsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.followUpsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateFollowUpTaskDto: UpdateFollowUpTaskDto,
    ) {
        return this.followUpsService.update(id, updateFollowUpTaskDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.followUpsService.remove(id);
    }
}
