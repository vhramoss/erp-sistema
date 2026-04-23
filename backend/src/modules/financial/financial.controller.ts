import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FinancialService } from './financial.service';
import { CreateTransactionDto, UpdateTransactionDto, FinancialQueryDto } from './dto/financial.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('financial')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar transação financeira' })
  create(@Body() dto: CreateTransactionDto, @CurrentUser('companyId') companyId: string) {
    return this.financialService.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações' })
  findAll(@Query() query: FinancialQueryDto, @CurrentUser('companyId') companyId: string) {
    return this.financialService.findAll(query, companyId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  summary(
    @CurrentUser('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getSummary(companyId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.financialService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar transação' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionDto, @CurrentUser('companyId') companyId: string) {
    return this.financialService.update(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover transação' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.financialService.remove(id, companyId);
  }
}
