import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.categoriesService.create(dto, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias' })
  findAll(@CurrentUser() user: any) {
    return this.categoriesService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter categoria por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: any) {
    return this.categoriesService.update(id, dto, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar categoria' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoriesService.remove(id, user.companyId);
  }
}
