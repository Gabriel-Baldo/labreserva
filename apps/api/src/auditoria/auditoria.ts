import { Injectable, Module } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export const ACOES_RESERVA = {
  criada: 'reserva.criada',
  aprovada: 'reserva.aprovada',
  recusada: 'reserva.recusada',
  cancelada: 'reserva.cancelada',
} as const;

export type EventoDeReserva = {
  acao: string;
  usuarioId: number;
  entidadeId: number;
  detalhes?: Record<string, unknown>;
};

@Injectable()
export class EmissorDeReservas {
  constructor(private readonly emissor: EventEmitter2) {}

  emitir(acao: string, usuarioId: number, reservaId: number, detalhes?: Record<string, unknown>): void {
    const evento: EventoDeReserva = { acao, usuarioId, entidadeId: reservaId, detalhes };
    this.emissor.emit(acao, evento);
  }
}

@Injectable()
export class AuditoriaListener {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('reserva.*', { async: true })
  async registrar(evento: EventoDeReserva): Promise<void> {
    await this.prisma.logAuditoria.create({
      data: {
        usuarioId: evento.usuarioId,
        acao: evento.acao,
        entidade: 'reserva',
        entidadeId: evento.entidadeId,
        detalhes: evento.detalhes as never,
      },
    });
  }
}

@Module({ providers: [EmissorDeReservas, AuditoriaListener], exports: [EmissorDeReservas] })
export class AuditoriaModule {}
