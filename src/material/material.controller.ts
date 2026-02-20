import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateRawMaterialDto } from 'src/dto/material/create-raw-material.dto';
import { CreateCompanyMaterialDto } from 'src/dto/material/create-company-material.dto';
import { UpdateCompanyMaterialReceiverDto } from 'src/dto/material/update-company-material.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';

@Controller('material')
@UseGuards(AuthGuard, RolesGuard)
export class MaterialController {
    constructor(private readonly materialService: MaterialService) { }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
    @Post('raw')
    createRawMaterial(@Body() createRawMaterialDto: CreateRawMaterialDto) {
        return this.materialService.createRawMaterial(createRawMaterialDto);
    }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER, Role.QUALITY, Role.TEMP_ADMIN)
    @Get('raw')
    getRawMaterials(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.materialService.getRawMaterials(Number(page), Number(limit));
    }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
    @Post('company')
    createCompanyMaterial(@Body() createCompanyMaterialDto: CreateCompanyMaterialDto) {
        return this.materialService.createCompanyMaterial(createCompanyMaterialDto);
    }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER, Role.QUALITY, Role.TEMP_ADMIN)
    @Get('company')
    getCompanyMaterials(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.materialService.getCompanyMaterials(Number(page), Number(limit));
    }

    @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.MANAGER)
    @Patch('company/:id/receiver')
    updateCompanyMaterialReceiver(
        @Param('id') id: string,
        @Body() updateCompanyMaterialReceiverDto: UpdateCompanyMaterialReceiverDto,
    ) {
        return this.materialService.updateCompanyMaterialReceiver(id, updateCompanyMaterialReceiverDto);
    }
}
