import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from 'src/dto/company/create-company.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';
import { UpdateCompanyDto } from 'src/dto/company/update-company.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    await this.companyService.createCompany(createCompanyDto);
    return {
      message: 'Company created successfully',
    };
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get()
  async getCompanies(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const res = await this.companyService.getCompanies(
      Number(page),
      Number(limit),
      search,
    );
    return res;
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('list')
  async getCompaniesList() {
    const res = await this.companyService.getCompaniesList();
    return res;
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    await this.companyService.deleteCompany(id);
    return {
      message: 'Company deleted successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Put(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    await this.companyService.updateCompany(id, updateCompanyDto);
    return {
      message: 'Company updated successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('get-all-parts')
  async getAllParts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.companyService.getAllParts(page, limit);
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('get-parts/:companyId')
  async getCompanyParts(@Param('companyId') companyId: string) {
    return this.companyService.getCompanyParts(companyId);
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post('add-part')
  async addPartToCompany(@Body() body: { companyId: string; part: any }) {
    const company = await this.companyService.addPartToCompany(
      body.companyId,
      body.part,
    );
    return company;
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Delete('remove-part/:partId')
  async removePartFromCompany(@Param('partId') partId: string) {
    const company = await this.companyService.removePart(partId);
    return {
      message: 'Part removed from company successfully',
      data: company,
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Put('update-part/:partId')
  async updatePartInCompany(
    @Param('partId') partId: string,
    @Body() body: any,
  ) {
    const company = await this.companyService.updatePart(partId, body);
    return {
      message: 'Part updated successfully',
      data: company,
    };
  }
}
