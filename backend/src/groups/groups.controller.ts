import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';
import { AtGuard } from '../common/guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(AtGuard)
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    @Get()
    findAll() {
        return this.groupsService.findAllWithMembers();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Get('member/:memberId')
    findByMember(@Param('memberId') memberId: string) {
        return this.groupsService.findByMember(memberId);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN', 'PASTOR')
    create(@Body() dto: CreateGroupDto) {
        return this.groupsService.create(dto);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN', 'PASTOR')
    update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
        return this.groupsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    remove(@Param('id') id: string) {
        return this.groupsService.remove(id);
    }

    @Post(':id/members')
    addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
        return this.groupsService.addMember(id, dto);
    }

    @Delete(':id/members/:memberId')
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
        return this.groupsService.removeMember(id, memberId);
    }

    @Patch(':id/members/:memberId/role')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN', 'PASTOR')
    updateMemberRole(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Body('role') role: string,
    ) {
        return this.groupsService.updateMemberRole(id, memberId, role);
    }

    // ======== ENTERPRISE ENDPOINTS ========

    @Get(':id/analytics')
    getAnalytics(@Param('id') id: string) {
        return this.groupsService.getAnalytics(id);
    }

    @Get(':id/activity')
    getActivity(@Param('id') id: string) {
        return this.groupsService.getActivity(id);
    }

    @Post(':id/invite')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN', 'PASTOR', 'DEPARTMENT_LEADER')
    generateInvite(@Param('id') id: string) {
        return this.groupsService.generateInviteCode(id);
    }

    @Post(':id/announce')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN', 'PASTOR')
    sendAnnouncement(
        @Param('id') id: string,
        @Body('title') title: string,
        @Body('message') message: string,
    ) {
        return this.groupsService.sendAnnouncement(id, title, message);
    }
}
