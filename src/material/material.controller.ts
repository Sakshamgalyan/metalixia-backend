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
import { UpdateRawMaterialDto } from 'src/dto/material/update-raw-material.dto';
import { ReceiveRawMaterialDto } from 'src/dto/material/receive-raw-material.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

import type { Response } from 'express';
import { Res } from '@nestjs/common';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from 'src/common/utils/export.util';

@Controller('material')
@UseGuards(AuthGuard, RolesGuard)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('raw/export')
  async exportRawMaterials(
    @Res() res: Response,
    @Query('format') format: string = 'xlsx',
    @Query('search') search?: string,
    @Query('materialName') materialName?: string,
    @Query('source') source?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.materialService.getRawMaterialsForExport({
      search,
      materialName,
      source,
      startDate,
      endDate,
    });
    const columns = [
      { header: 'Material Name', key: 'materialName', width: 30 },
      { header: 'Source', key: 'source', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Invoice', key: 'invoiceNumber', width: 20 },
      { header: 'Location', key: 'inventoryLocation', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Received At', key: 'receivedAt', width: 20 },
      { header: 'Received By', key: 'receivedBy', width: 20 },
    ];
    const filename = `Raw_Materials_Export_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') return exportToCSV(res, filename, columns, data);
    if (format === 'pdf') {
      return exportToPDF(
        res,
        filename,
        columns,
        data,
        'Raw Materials Procurement Report',
      );
    }
    return exportToExcel(res, filename, columns, data, 'Raw Materials');
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('raw/unique-filters')
  async getRawUniqueFilters() {
    return this.materialService.getRawUniqueList();
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('company/export')
  async exportCompanyMaterials(
    @Res() res: Response,
    @Query('format') format: string = 'xlsx',
    @Query('search') search?: string,
    @Query('companyName') companyName?: string,
    @Query('partName') partName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.materialService.getCompanyMaterialsForExport({
      search,
      companyName,
      partName,
      startDate,
      endDate,
    });
    const columns = [
      { header: 'Part Number', key: 'partNumber', width: 20 },
      { header: 'Part Name', key: 'partName', width: 25 },
      { header: 'Company', key: 'companyName', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Location', key: 'inventoryLocation', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Received On', key: 'receivedOn', width: 20 },
      { header: 'Received By', key: 'receivedBy', width: 20 },
    ];
    const filename = `Company_Materials_Export_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') return exportToCSV(res, filename, columns, data);
    if (format === 'pdf') {
      return exportToPDF(
        res,
        filename,
        columns,
        data,
        'Company Materials Inventory Report',
      );
    }
    return exportToExcel(res, filename, columns, data, 'Company Materials');
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('company/unique-filters')
  async getCompanyUniqueFilters() {
    return this.materialService.getCompanyUniqueList();
  }

  // ── Inventory Endpoints moved to InventoryController ───────────────────────────────

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Patch(':type/:id/status')
  async updateMaterialStatus(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    await this.materialService.updateMaterialStatus(type, id, status);
    return { message: 'Material status updated successfully' };
  }

  // ── Dispatch Endpoints ────────────────────────────────────────
  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('dispatch')
  async getDispatchItems(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.materialService.getDispatchItems(
      Number(page),
      Number(limit),
      search,
      status,
    );
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('dispatch/stats')
  async getDispatchStats() {
    return this.materialService.getDispatchStats();
  }

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
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const res = await this.materialService.getRawMaterials(
      Number(page),
      Number(limit),
      search,
      status,
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
  @Get('raw/stats')
  async getRawMaterialStats() {
    const res = await this.materialService.getRawMaterialStats();
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

  @Roles(Role.SUPER_ADMIN)
  @Patch('raw/:id')
  async updateRawMaterial(
    @Param('id') id: string,
    @Body() updateRawMaterialDto: UpdateRawMaterialDto,
  ) {
    await this.materialService.updateRawMaterial(id, updateRawMaterialDto);
    return {
      message: 'Raw material updated successfully',
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN)
  @Patch('raw/:id/receive')
  async receiveRawMaterial(
    @Param('id') id: string,
    @Body() receiveRawMaterialDto: ReceiveRawMaterialDto,
  ) {
    await this.materialService.receiveRawMaterial(id, receiveRawMaterialDto);
    return {
      message: 'Raw material marked as received',
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
    @Query('status') status?: string,
  ) {
    const res = await this.materialService.getCompanyMaterials(
      Number(page),
      Number(limit),
      search,
      status,
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
