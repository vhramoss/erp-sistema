import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('customers')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar cliente' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser('companyId') companyId: string) {
    return this.customersService.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(@Query() query: CustomerQueryDto, @CurrentUser('companyId') companyId: string) {
    return this.customersService.findAll(query, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.customersService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto, @CurrentUser('companyId') companyId: string) {
    return this.customersService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar cliente' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.customersService.remove(id, companyId);
  }
}
