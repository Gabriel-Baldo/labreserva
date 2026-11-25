import { Injectable } from '@nestjs/common';
import { Perfil, RegraPerfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const CHAVES = {
  maxTentativas: 'auth.maxTentativas',
  bloqueioMinutos: 'auth.bloqueioMinutos',
  cancelamentoAntecedenciaMinutos: 'cancelamento.antecedenciaMinimaMinutos',
  fusoHorario: 'fusoHorario',
} as const;

@Injectable()
export class ConfiguracaoService {
  constructor(private readonly prisma: PrismaService) {}

  async texto(chave: string): Promise<string> {
    const linha = await this.prisma.configuracao.findUniqueOrThrow({ where: { chave } });
    return linha.valor;
  }

  async numero(chave: string): Promise<number> {
    return Number(await this.texto(chave));
  }

  regraDoPerfil(perfil: Perfil): Promise<RegraPerfil> {
    return this.prisma.regraPerfil.findUniqueOrThrow({ where: { perfil } });
  }
}
