import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar usuário' })
  create(@Body() dto: CreateUserDto, @CurrentUser('companyId') companyId: string) {
    return this.usersService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar usuários da empresa' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser('companyId') companyId: string) {
    return this.usersService.update(id, dto, companyId);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Alterar senha' })
  changePassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangePasswordDto, @CurrentUser('companyId') companyId: string) {
    return this.usersService.changePassword(id, dto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar usuário' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('companyId') companyId: string) {
    return this.usersService.remove(id, companyId);
  }
}
