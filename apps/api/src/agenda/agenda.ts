import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601 } from 'class-validator';
import { UsuarioAtual, UsuarioAutenticado } from '../common/decorators';
import { STATUS_ATIVOS } from '../common/status';
import { PrismaService } from '../prisma/prisma.service';

export class AgendaQuery {
  @Type(() => Number)
  @IsInt()
  laboratorioId: number;

  @IsISO8601()
  de: string;

  @IsISO8601()
  ate: string;
}

export type EventoDeAgenda = {
  tipo: 'reserva' | 'bloqueio';
  id: number;
  inicio: Date;
  fim: Date;
  situacao: string;
  descricao: string;
  minha: boolean;
};

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(usuario: UsuarioAutenticado, consulta: AgendaQuery): Promise<EventoDeAgenda[]> {
    const janela = { inicio: { lt: new Date(consulta.ate) }, fim: { gt: new Date(consulta.de) } };
    const [reservas, bloqueios] = await Promise.all([
      this.prisma.reserva.findMany({
        where: { laboratorioId: consulta.laboratorioId, status: { in: STATUS_ATIVOS }, ...janela },
        orderBy: { inicio: 'asc' },
      }),
      this.prisma.bloqueio.findMany({ where: { laboratorioId: consulta.laboratorioId, ...janela }, orderBy: { inicio: 'asc' } }),
    ]);
    return [
      ...reservas.map((reserva) => ({
        tipo: 'reserva' as const,
        id: reserva.id,
        inicio: reserva.inicio,
        fim: reserva.fim,
        situacao: reserva.status,
        descricao: reserva.finalidade,
        minha: reserva.usuarioId === usuario.id,
      })),
      ...bloqueios.map((bloqueio) => ({
        tipo: 'bloqueio' as const,
        id: bloqueio.id,
        inicio: bloqueio.inicio,
        fim: bloqueio.fim,
        situacao: 'BLOQUEIO',
        descricao: bloqueio.motivo,
        minha: false,
      })),
    ];
  }
}

@ApiTags('agenda')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get()
  consultar(@UsuarioAtual() usuario: UsuarioAutenticado, @Query() consulta: AgendaQuery) {
    return this.agenda.consultar(usuario, consulta);
  }
}
