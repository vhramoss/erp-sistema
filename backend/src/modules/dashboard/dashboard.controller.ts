import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('dashboard')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Métricas do dashboard' })
  getMetrics(@CurrentUser('companyId') companyId: string) {
    return this.dashboardService.getMetrics(companyId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Gráfico de faturamento mensal' })
  getRevenueChart(@CurrentUser('companyId') companyId: string, @Query('months') months = 6) {
    return this.dashboardService.getRevenueChart(companyId, Number(months));
  }
}
