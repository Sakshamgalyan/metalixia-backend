import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetEmployeesDto } from '../dto/admin/GetEmployees.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('get-employees')
  getEmployees(@Body() getEmployeesDto: GetEmployeesDto) {
    return this.adminService.getEmployees(getEmployeesDto);
  }
}
