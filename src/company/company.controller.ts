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
import { STATUS_CODES } from 'http';
import { UpdateCompanyDto } from 'src/dto/company/update-company.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    await this.companyService.createCompany(createCompanyDto);
    return (
      STATUS_CODES.OK,
      {
        message: 'Company created successfully',
      }
    );
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
    return (
      STATUS_CODES.OK,
      {
        message: 'Companies fetched successfully',
        data: res,
      }
    );
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
    return (
      STATUS_CODES.OK,
      {
        message: 'Company updated successfully',
      }
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('get-parts/:companyId')
  async getCompanyParts(@Param('companyId') companyId: string) {
    const company = await this.companyService.getCompanyParts(companyId);
    return (
      STATUS_CODES.OK,
      {
        message: 'Company fetched successfully',
        data: company,
      }
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post('add-part')
  async addPartToCompany(@Body() body: { companyId: string; part: any }) {
    const company = await this.companyService.addPartToCompany(body.companyId, body.part);
    return (
      STATUS_CODES.OK,
      {
        message: 'Part added to company successfully',
        data: company,
      }
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Delete('remove-part/:partId')
  async removePartFromCompany(@Param('partId') partId: string) {
    const company = await this.companyService.removePart(partId);
    return (
      STATUS_CODES.OK,
      {
        message: 'Part removed from company successfully',
        data: company,
      }
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Put('update-part/:partId')
  async updatePartInCompany(@Param('partId') partId: string, @Body() body: any) {
    const company = await this.companyService.updatePart(partId, body);
    return (
      STATUS_CODES.OK,
      {
        message: 'Part updated successfully',
        data: company,
      }
    );
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('get-all-parts')
  async getAllParts() {
    const companies = await this.companyService.getAllParts();
    
    // Flatten the parts from all companies
    const allParts = companies.reduce((acc: any[], company: any) => {
      if (company.parts && Array.isArray(company.parts)) {
        const companyParts = company.parts.map((p: any) => ({
          ...p.toObject?.() || p,
          companyId: company._id,
          companyName: company.companyName,
        }));
        return acc.concat(companyParts);
      }
      return acc;
    }, []);

    return (
      STATUS_CODES.OK,
      {
        message: 'Parts fetched successfully',
        data: allParts,
      }
    );
  }
}