import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateRawMaterialDto } from 'src/dto/material/create-raw-material.dto';
import { CreateCompanyMaterialDto } from 'src/dto/material/create-company-material.dto';
import { UpdateCompanyMaterialReceiverDto } from 'src/dto/material/update-company-material.dto';
import { UpdateCompanyMaterialFullDto } from 'src/dto/material/update-company-material-full.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

@Controller('material')
@UseGuards(AuthGuard, RolesGuard)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post('raw')
  async createRawMaterial(@Body() createRawMaterialDto: CreateRawMaterialDto) {
    await this.materialService.createRawMaterial(createRawMaterialDto);
    return {
      message: 'Raw material created successfully',
    };
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('raw')
  async getRawMaterials(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const res = await this.materialService.getRawMaterials(
      Number(page),
      Number(limit),
    );
    return res;
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Delete('raw/:id')
  async deleteRawMaterial(@Param('id') id: string) {
    await this.materialService.deleteRawMaterial(id);
    return {
      message: 'Raw material deleted successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post('company')
  async createCompanyMaterial(
    @Body() createCompanyMaterialDto: CreateCompanyMaterialDto,
  ) {
    await this.materialService.createCompanyMaterial(createCompanyMaterialDto);
    return {
      message: 'Company material created successfully',
    };
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('company/stats')
  async getCompanyMaterialStats() {
    const res = await this.materialService.getCompanyMaterialStats();
    return res;
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('company')
  async getCompanyMaterials(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const res = await this.materialService.getCompanyMaterials(
      Number(page),
      Number(limit),
      search,
    );
    return res;
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('company/:id')
  async updateCompanyMaterial(
    @Param('id') id: string,
    @Body() updateCompanyMaterialFullDto: UpdateCompanyMaterialFullDto,
  ) {
    await this.materialService.updateCompanyMaterial(
      id,
      updateCompanyMaterialFullDto,
    );
    return {
      message: 'Company material updated successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN)
  @Patch('company/:id/receiver')
  async updateCompanyMaterialReceiver(
    @Param('id') id: string,
    @Body() updateCompanyMaterialReceiverDto: UpdateCompanyMaterialReceiverDto,
  ) {
    await this.materialService.updateCompanyMaterialReceiver(
      id,
      updateCompanyMaterialReceiverDto,
    );
    return {
      message: 'Company material receiver updated successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Delete('company/:id')
  async deleteCompanyMaterial(@Param('id') id: string) {
    await this.materialService.deleteCompanyMaterial(id);
    return {
      message: 'Company material deleted successfully',
    };
  }
}
