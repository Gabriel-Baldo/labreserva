import { RegraPerfil } from '@prisma/client';
import { MENSAGENS } from '../common/mensagens';
import { RegraDeNegocioException } from '../common/excecoes';
import { diferencaEmMinutos, somarDias, somarMinutos } from '../common/tempo';

export type RegraDeJanela = Pick<RegraPerfil, 'duracaoMaximaMinutos' | 'antecedenciaMaximaDias' | 'antecedenciaMinimaMinutos'>;

export const validarJanela = (inicio: Date, fim: Date, regra: RegraDeJanela, agora: Date): void => {
  if (fim.getTime() <= inicio.getTime()) throw new RegraDeNegocioException(MENSAGENS.intervaloInvalido);
  if (inicio.getTime() < somarMinutos(agora, regra.antecedenciaMinimaMinutos).getTime()) {
    throw new RegraDeNegocioException(MENSAGENS.dataNoPassado);
  }
  const limiteDeDuracao = regra.duracaoMaximaMinutos;
  if (limiteDeDuracao !== null && diferencaEmMinutos(inicio, fim) > limiteDeDuracao) {
    throw new RegraDeNegocioException(MENSAGENS.duracaoAcimaDoLimite);
  }
  const limiteDeAntecedencia = regra.antecedenciaMaximaDias;
  if (limiteDeAntecedencia !== null && inicio.getTime() > somarDias(agora, limiteDeAntecedencia).getTime()) {
    throw new RegraDeNegocioException(MENSAGENS.antecedenciaAcimaDoLimite);
  }
};
