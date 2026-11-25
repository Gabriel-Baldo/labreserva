import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UsuarioAtual, UsuarioAutenticado } from '../common/decorators';
import { ReservasService } from './reservas.service';

export class CriarReservaDto {
  @Type(() => Number)
  @IsInt()
  laboratorioId: number;

  @IsISO8601()
  inicio: string;

  @IsISO8601()
  fim: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  finalidade: string;
}

@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: CriarReservaDto) {
    return this.reservas.criar(usuario, {
      laboratorioId: dto.laboratorioId,
      inicio: new Date(dto.inicio),
      fim: new Date(dto.fim),
      finalidade: dto.finalidade.trim(),
    });
  }

  @Get('minhas')
  minhas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.reservas.minhas(usuario.id);
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  cancelar(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id', ParseIntPipe) id: number) {
    return this.reservas.cancelar(usuario, id);
  }
}
