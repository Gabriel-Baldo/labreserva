import { Injectable, NotFoundException } from '@nestjs/common';
import { Reserva, StatusReserva } from '@prisma/client';
import { ACOES_RESERVA, EmissorDeReservas } from '../auditoria/auditoria';
import { UsuarioAutenticado } from '../common/decorators';
import { RegraDeNegocioException } from '../common/excecoes';
import { MENSAGENS } from '../common/mensagens';
import { Relogio } from '../common/relogio';
import { STATUS_ATIVOS } from '../common/status';
import { DisponibilidadeService } from '../disponibilidade/disponibilidade.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AprovacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidade: DisponibilidadeService,
    private readonly emissor: EmissorDeReservas,
    private readonly relogio: Relogio,
  ) {}

  pendentes() {
    return this.prisma.reserva.findMany({
      where: { status: StatusReserva.PENDENTE },
      include: { usuario: { select: { nome: true, perfil: true } }, laboratorio: { select: { nome: true } } },
      orderBy: { inicio: 'asc' },
    });
  }

  async aprovar(admin: UsuarioAutenticado, id: number): Promise<Reserva> {
    const reserva = await this.obterPendente(id);
    await this.disponibilidade.verificarReservas(this.prisma, { ...reserva, ignorarReservaId: id });
    return this.decidir(admin, reserva, StatusReserva.APROVADA, ACOES_RESERVA.aprovada);
  }

  async recusar(admin: UsuarioAutenticado, id: number, justificativa: string): Promise<Reserva> {
    const reserva = await this.obterPendente(id);
    return this.decidir(admin, reserva, StatusReserva.RECUSADA, ACOES_RESERVA.recusada, justificativa);
  }

  async cancelar(admin: UsuarioAutenticado, id: number, motivo: string): Promise<Reserva> {
    const reserva = await this.obter(id);
    if (!STATUS_ATIVOS.includes(reserva.status)) throw new RegraDeNegocioException(MENSAGENS.reservaNaoCancelavel);
    return this.decidir(admin, reserva, StatusReserva.CANCELADA, ACOES_RESERVA.cancelada, motivo);
  }

  private async obter(id: number): Promise<Reserva> {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva) throw new NotFoundException(MENSAGENS.reservaNaoEncontrada);
    return reserva;
  }

  private async obterPendente(id: number): Promise<Reserva> {
    const reserva = await this.obter(id);
    if (reserva.status !== StatusReserva.PENDENTE) throw new RegraDeNegocioException(MENSAGENS.reservaNaoPendente);
    return reserva;
  }

  private async decidir(
    admin: UsuarioAutenticado,
    reserva: Reserva,
    status: StatusReserva,
    acao: string,
    justificativa?: string,
  ): Promise<Reserva> {
    const atualizada = await this.prisma.reserva.update({
      where: { id: reserva.id },
      data: { status, justificativa, decididoPor: admin.id, decididoEm: this.relogio.agora() },
    });
    this.emissor.emitir(acao, admin.id, reserva.id, { justificativa });
    return atualizada;
  }
}
