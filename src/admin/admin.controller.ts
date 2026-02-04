import { Controller, Post, Body, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetEmployeesDto } from '../dto/admin/GetEmployees.dto';
import type { Response } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('get-employees')
  async getEmployees(
    @Body() getEmployeesDto: GetEmployeesDto,
    @Res() res: Response,
  ) {
    const data = await this.adminService.getEmployees(getEmployeesDto);
    return res.status(200).send(data);
  }
}
