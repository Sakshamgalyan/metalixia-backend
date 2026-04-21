import { Injectable, Logger } from '@nestjs/common';
import { GetEmployeesDto } from '../dto/admin/GetEmployees.dto';
import { UserService } from 'src/user/user.service';
import { AddEmployeeDto } from 'src/dto/admin/AddEmployee.dto';
import { UpdateEmployeeDto } from 'src/dto/admin/UpdateEmployee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private readonly userService: UserService) {}

  async getEmployees(getEmployeesDto: GetEmployeesDto) {
    const users = await this.userService.findByEmployee(getEmployeesDto);
    return users;
  }

  async getEmployeesList() {
    return this.userService.findAllEmployeesForList();
  }

  async addEmployee(addEmployeeDto: AddEmployeeDto) {
    const hashedPassword = await bcrypt.hash(addEmployeeDto.password, 10);
    await this.userService.createUser({
      ...addEmployeeDto,
      password: hashedPassword,
    });
    return { message: 'Employee added successfully', status: 'success' };
  }

  async updateEmployee(updateEmployeeDto: UpdateEmployeeDto) {
    const { id, ...rest } = updateEmployeeDto;
    await this.userService.updateUser({
      _id: id,
      ...rest,
    });
    return { message: 'Employee updated successfully', status: 'success' };
  }

  async deleteEmployee(id: string) {
    await this.userService.deleteUser(id);
    return { message: 'Employee deleted successfully', status: 'success' };
  }
}
