import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QualityService } from './quality.service';
import { CreateQualityCheckDto } from 'src/dto/quality/create-quality-check.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

@Controller('quality')
@UseGuards(AuthGuard, RolesGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get()
  async getQualityChecks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('result') result?: string,
  ) {
    return this.qualityService.getQualityChecks(
      Number(page),
      Number(limit),
      search,
      result,
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
  async getQualityStats() {
    return this.qualityService.getQualityStats();
  }

  @Roles(
    Role.SUPER_ADMIN,
    Role.REPORT_ADMIN,
    Role.MANAGER,
    Role.QUALITY,
    Role.TEMP_ADMIN,
  )
  @Get('pending')
  async getPendingInspections() {
    const data = await this.qualityService.getPendingInspections();
    return { data };
  }

  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.QUALITY)
  @Post('inspect/:productionOrderId')
  async inspectOrder(
    @Param('productionOrderId') productionOrderId: string,
    @Body() dto: CreateQualityCheckDto,
  ) {
    const check = await this.qualityService.inspectOrder(
      productionOrderId,
      dto,
    );
    return {
      message: 'Inspection submitted successfully',
      data: check,
    };
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('seed-mock')
  async seedMockData() {
    return this.qualityService.seedMockData();
  }
}
