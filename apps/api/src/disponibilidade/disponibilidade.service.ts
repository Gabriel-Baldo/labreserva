import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MENSAGENS } from '../common/mensagens';
import { ConflitoDeHorarioException, RegraDeNegocioException } from '../common/excecoes';
import { STATUS_ATIVOS } from '../common/status';
import { minutosDeHora, partesLocais } from '../common/tempo';
import { CHAVES, ConfiguracaoService } from '../configuracao/configuracao.service';

export type Banco = Pick<Prisma.TransactionClient, 'laboratorio' | 'reserva' | 'bloqueio'>;

export type Periodo = { laboratorioId: number; inicio: Date; fim: Date; ignorarReservaId?: number };

@Injectable()
export class DisponibilidadeService {
  constructor(private readonly configuracao: ConfiguracaoService) {}

  async verificar(banco: Banco, periodo: Periodo): Promise<void> {
    const laboratorio = await banco.laboratorio.findUnique({ where: { id: periodo.laboratorioId } });
    if (!laboratorio) throw new NotFoundException(MENSAGENS.laboratorioNaoEncontrado);
    if (!laboratorio.ativo) throw new RegraDeNegocioException(MENSAGENS.laboratorioInativo);
    await this.verificarFuncionamento(laboratorio, periodo);
    await this.verificarBloqueios(banco, periodo);
    await this.verificarReservas(banco, periodo);
  }

  async verificarReservas(banco: Banco, periodo: Periodo): Promise<void> {
    const sobreposta = await banco.reserva.findFirst({
      where: {
        laboratorioId: periodo.laboratorioId,
        status: { in: STATUS_ATIVOS },
        id: { not: periodo.ignorarReservaId },
        inicio: { lt: periodo.fim },
        fim: { gt: periodo.inicio },
      },
    });
    if (sobreposta) throw new ConflitoDeHorarioException(MENSAGENS.conflitoComReserva);
  }

  private async verificarBloqueios(banco: Banco, periodo: Periodo): Promise<void> {
    const bloqueio = await banco.bloqueio.findFirst({
      where: { laboratorioId: periodo.laboratorioId, inicio: { lt: periodo.fim }, fim: { gt: periodo.inicio } },
    });
    if (bloqueio) throw new ConflitoDeHorarioException(MENSAGENS.conflitoComBloqueio);
  }

  private async verificarFuncionamento(laboratorio: { abertura: string; fechamento: string }, periodo: Periodo): Promise<void> {
    const fuso = await this.configuracao.texto(CHAVES.fusoHorario);
    const inicio = partesLocais(periodo.inicio, fuso);
    const fim = partesLocais(periodo.fim, fuso);
    const dentro =
      inicio.dia === fim.dia &&
      inicio.minutos >= minutosDeHora(laboratorio.abertura) &&
      fim.minutos <= minutosDeHora(laboratorio.fechamento);
    if (!dentro) throw new RegraDeNegocioException(MENSAGENS.foraDoFuncionamento);
  }
}
