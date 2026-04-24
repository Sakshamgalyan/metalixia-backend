import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateProductionOrderDto } from 'src/dto/production/create-production-order.dto';
import {
  UpdateProductionStatusDto,
  AdvanceProcessDto,
} from 'src/dto/production/update-production-status.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

@Controller('production')
@UseGuards(AuthGuard, RolesGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Post()
  async createProductionOrder(@Body() dto: CreateProductionOrderDto) {
    const order = await this.productionService.createProductionOrder(dto);
    return {
      message: 'Production order created successfully',
      data: order,
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
  async getProductionOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.productionService.getProductionOrders(
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
  @Get('stats')
  async getProductionStats() {
    return this.productionService.getProductionStats();
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('pipeline')
  async getPipelineView() {
    const data = await this.productionService.getPipelineView();
    return { data };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
  @Patch(':id/advance')
  async advanceProcess(
    @Param('id') id: string,
    @Body() dto: AdvanceProcessDto,
  ) {
    const order = await this.productionService.advanceProcess(id, dto);
    return {
      message: 'Process advanced successfully',
      data: order,
    };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER, Role.QUALITY)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductionStatusDto,
  ) {
    const order = await this.productionService.updateStatus(id, dto);
    return {
      message: 'Status updated successfully',
      data: order,
    };
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('seed-mock')
  async seedMockData() {
    return this.productionService.seedMockData();
  }
}
