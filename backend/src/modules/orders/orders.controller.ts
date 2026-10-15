import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('orders')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pedido/venda' })
  create(@Body() dto: CreateOrderDto, @CurrentUser('companyId') companyId: string) {
    return this.ordersService.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos' })
  findAll(@Query() query: OrderQueryDto, @CurrentUser('companyId') companyId: string) {
    return this.ordersService.findAll(query, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.ordersService.findOne(id, companyId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, companyId);
  }
}
