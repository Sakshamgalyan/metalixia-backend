import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';
import { SetMinStockDto } from 'src/dto/material/set-min-stock.dto';
import { ConsumeMaterialDto } from 'src/dto/material/consume-material.dto';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from 'src/common/utils/export.util';

@Controller('material/inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Get('export')
  async exportInventory(
    @Res() res: Response,
    @Query('format') format: string = 'xlsx',
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('materialName') materialName?: string,
    @Query('companyName') companyName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.inventoryService.getInventoryForExport({
      search,
      type,
      status,
      materialName,
      companyName,
      startDate,
      endDate,
    });

    const columns = [
      { header: 'Material Name', key: 'materialName', width: 30 },
      { header: 'Type', key: 'sourceType', width: 15 },
      { header: 'Part Number', key: 'partNumber', width: 20 },
      { header: 'Part Name', key: 'partName', width: 25 },
      { header: 'Company', key: 'companyName', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Location', key: 'inventoryLocation', width: 20 },
      { header: 'Min Stock', key: 'minStock', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Received At', key: 'receivedAt', width: 20 },
      { header: 'Received By', key: 'receivedBy', width: 20 },
    ];

    const filename = `Inventory_Export_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      return exportToCSV(res, filename, columns, data);
    }
    if (format === 'pdf') {
      return exportToPDF(
        res,
        filename,
        columns,
        data,
        'Current Inventory Stock Report',
      );
    }
    return exportToExcel(res, filename, columns, data, 'Inventory');
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('unique-filters')
  async getInventoryUniqueFilters() {
    return this.inventoryService.getInventoryUniqueList();
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get()
  async getInventoryItems(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getInventoryItems(
      Number(page),
      Number(limit),
      search,
      type,
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
  @Get('stats')
  async getInventoryStats() {
    return this.inventoryService.getInventoryStats();
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @Patch(':id/min-stock')
  async setMinStock(@Param('id') id: string, @Body() dto: SetMinStockDto) {
    return this.inventoryService.setMinStock(id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.QUALITY)
  @Patch(':id/consume')
  async consumeMaterial(
    @Param('id') id: string,
    @Body() dto: ConsumeMaterialDto,
  ) {
    return this.inventoryService.consumeMaterial(id, dto);
  }
}
