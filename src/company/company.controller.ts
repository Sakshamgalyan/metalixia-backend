import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from 'src/dto/company/create-company.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

@Controller('company')
@UseGuards(AuthGuard, RolesGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
    @Post()
    createCompany(@Body() createCompanyDto: CreateCompanyDto) {
        return this.companyService.createCompany(createCompanyDto);
    }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER, Role.QUALITY, Role.TEMP_ADMIN)
    @Get()
    getCompanies(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
    ) {
        return this.companyService.getCompanies(Number(page), Number(limit), search);
    }
}
