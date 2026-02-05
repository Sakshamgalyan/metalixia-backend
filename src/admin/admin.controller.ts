import { Controller, Post, Body, Res, UseGuards, Delete, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetEmployeesDto } from '../dto/admin/GetEmployees.dto';
import type { Response } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/dto/Role/Role.dto';
import { AddEmployeeDto } from 'src/dto/admin/AddEmployee.dto';
import { UpdateEmployeeDto } from 'src/dto/admin/UpdateEmployee.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN)
  @Post('get-employees')
  async getEmployees(
    @Body() getEmployeesDto: GetEmployeesDto,
    @Res() res: Response,
  ) {
    const data = await this.adminService.getEmployees(getEmployeesDto);
    return res.status(200).send(data);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN)
  @Post('add-employee')
  async addEmployee(
    @Body() addEmployeeDto: AddEmployeeDto,
    @Res() res: Response,
  ) {
    const data = await this.adminService.addEmployee(addEmployeeDto);
    return res.status(200).send(data);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN)
  @Post('update-employee')
  async updateEmployee(
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Res() res: Response,
  ) {
    const data = await this.adminService.updateEmployee(updateEmployeeDto);
    return res.status(200).send(data);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN)
  @Delete('delete-employee/:id')
  async deleteEmployee(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = await this.adminService.deleteEmployee(id);
    return res.status(200).send(data);
  }
}
