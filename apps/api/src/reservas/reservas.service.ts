import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Reserva } from '@prisma/client';
import { ACOES_RESERVA, EmissorDeReservas } from '../auditoria/auditoria';
import { UsuarioAutenticado } from '../common/decorators';
import { ConflitoDeHorarioException, ehViolacaoDeExclusao, RegraDeNegocioException } from '../common/excecoes';
import { MENSAGENS } from '../common/mensagens';
import { Relogio } from '../common/relogio';
import { STATUS_ATIVOS } from '../common/status';
import { diferencaEmMinutos } from '../common/tempo';
import { CHAVES, ConfiguracaoService } from '../configuracao/configuracao.service';
import { DisponibilidadeService } from '../disponibilidade/disponibilidade.service';
import { PrismaService } from '../prisma/prisma.service';
import { validarJanela } from './janela-reserva';

export type NovaReserva = { laboratorioId: number; inicio: Date; fim: Date; finalidade: string };

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracao: ConfiguracaoService,
    private readonly disponibilidade: DisponibilidadeService,
    private readonly emissor: EmissorDeReservas,
    private readonly relogio: Relogio,
  ) {}

  async criar(usuario: UsuarioAutenticado, dados: NovaReserva): Promise<Reserva> {
    const regra = await this.configuracao.regraDoPerfil(usuario.perfil);
    validarJanela(dados.inicio, dados.fim, regra, this.relogio.agora());
    const reserva = await this.prisma
      .$transaction(async (tx) => {
        await tx.$queryRaw(Prisma.sql`SELECT id FROM laboratorio WHERE id = ${dados.laboratorioId} FOR UPDATE`);
        await this.disponibilidade.verificar(tx, dados);
        return tx.reserva.create({
          data: { ...dados, usuarioId: usuario.id, status: regra.statusInicial },
        });
      })
      .catch((erro) => {
        if (!ehViolacaoDeExclusao(erro)) throw erro;
        throw new ConflitoDeHorarioException(MENSAGENS.conflitoComReserva);
      });
    this.emissor.emitir(ACOES_RESERVA.criada, usuario.id, reserva.id, { status: reserva.status });
    return reserva;
  }

  minhas(usuarioId: number) {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      include: { laboratorio: { select: { id: true, nome: true } } },
      orderBy: { inicio: 'desc' },
    });
  }

  async cancelar(usuario: UsuarioAutenticado, id: number): Promise<Reserva> {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    if (!reserva) throw new NotFoundException(MENSAGENS.reservaNaoEncontrada);
    if (reserva.usuarioId !== usuario.id) throw new ForbiddenException(MENSAGENS.reservaDeOutroUsuario);
    if (!STATUS_ATIVOS.includes(reserva.status)) throw new RegraDeNegocioException(MENSAGENS.reservaNaoCancelavel);
    const antecedenciaMinima = await this.configuracao.numero(CHAVES.cancelamentoAntecedenciaMinutos);
    if (diferencaEmMinutos(this.relogio.agora(), reserva.inicio) < antecedenciaMinima) {
      throw new RegraDeNegocioException(MENSAGENS.prazoDeCancelamentoEncerrado);
    }
    const cancelada = await this.prisma.reserva.update({ where: { id }, data: { status: 'CANCELADA' } });
    this.emissor.emitir(ACOES_RESERVA.cancelada, usuario.id, id);
    return cancelada;
  }
}
