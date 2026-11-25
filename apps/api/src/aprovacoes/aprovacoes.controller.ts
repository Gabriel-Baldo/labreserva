import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Perfis, UsuarioAtual, UsuarioAutenticado } from '../common/decorators';
import { AprovacoesService } from './aprovacoes.service';

class JustificativaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  justificativa: string;
}

@ApiTags('aprovacoes')
@Perfis('ADMIN')
@Controller('aprovacoes')
export class AprovacoesController {
  constructor(private readonly aprovacoes: AprovacoesService) {}

  @Get('pendentes')
  pendentes() {
    return this.aprovacoes.pendentes();
  }

  @Post(':id/aprovar')
  @HttpCode(200)
  aprovar(@UsuarioAtual() admin: UsuarioAutenticado, @Param('id', ParseIntPipe) id: number) {
    return this.aprovacoes.aprovar(admin, id);
  }

  @Post(':id/recusar')
  @HttpCode(200)
  recusar(@UsuarioAtual() admin: UsuarioAutenticado, @Param('id', ParseIntPipe) id: number, @Body() dto: JustificativaDto) {
    return this.aprovacoes.recusar(admin, id, dto.justificativa.trim());
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  cancelar(@UsuarioAtual() admin: UsuarioAutenticado, @Param('id', ParseIntPipe) id: number, @Body() dto: JustificativaDto) {
    return this.aprovacoes.cancelar(admin, id, dto.justificativa.trim());
  }
}
