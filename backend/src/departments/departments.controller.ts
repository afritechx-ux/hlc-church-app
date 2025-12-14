import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    findAll() {
        return this.departmentsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(id);
    }

    @Get(':id/members')
    async getMembers(@Param('id') id: string) {
        const department = await this.departmentsService.findOne(id);
        if (!department) return [];
        return department.members.map((dm: any) => dm.member);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
    ) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }

    @Post(':id/members/:memberId')
    addMember(
        @Param('id') departmentId: string,
        @Param('memberId') memberId: string,
        @Body('role') role?: string,
    ) {
        return this.departmentsService.addMember(departmentId, memberId, role);
    }

    @Delete(':id/members/:memberId')
    removeMember(
        @Param('id') departmentId: string,
        @Param('memberId') memberId: string,
    ) {
        return this.departmentsService.removeMember(departmentId, memberId);
    }
}
