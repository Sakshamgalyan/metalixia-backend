import { Injectable, Logger } from '@nestjs/common';
import { GetEmployeesDto } from '../dto/admin/GetEmployees.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private readonly userService: UserService) {}

  async getEmployees(getEmployeesDto: GetEmployeesDto) {
    const users = await this.userService.findByEmployee(getEmployeesDto);
    return users;
  }
}
