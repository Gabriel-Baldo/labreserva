import { RegraDeNegocioException } from '../common/excecoes';
import { somarDias, somarMinutos } from '../common/tempo';
import { RegraDeJanela, validarJanela } from './janela-reserva';

const AGORA = new Date('2026-12-01T12:00:00.000Z');
const LIMITE_DE_DUAS_HORAS = 120;
const LIMITE_DE_TRINTA_DIAS = 30;

const regraDeAluno: RegraDeJanela = {
  duracaoMaximaMinutos: LIMITE_DE_DUAS_HORAS,
  antecedenciaMaximaDias: LIMITE_DE_TRINTA_DIAS,
  antecedenciaMinimaMinutos: 0,
};

const regraSemLimites: RegraDeJanela = { duracaoMaximaMinutos: null, antecedenciaMaximaDias: null, antecedenciaMinimaMinutos: 0 };

const inicio = somarMinutos(AGORA, 60);

describe('validarJanela', () => {
  it('aceita duração exatamente no limite', () => {
    expect(() => validarJanela(inicio, somarMinutos(inicio, LIMITE_DE_DUAS_HORAS), regraDeAluno, AGORA)).not.toThrow();
  });

  it('recusa duração um minuto acima do limite', () => {
    expect(() => validarJanela(inicio, somarMinutos(inicio, LIMITE_DE_DUAS_HORAS + 1), regraDeAluno, AGORA)).toThrow(RegraDeNegocioException);
  });

  it('não limita a duração quando a regra do perfil não tem limite', () => {
    expect(() => validarJanela(inicio, somarMinutos(inicio, 600), regraSemLimites, AGORA)).not.toThrow();
  });

  it('recusa fim igual ao início', () => {
    expect(() => validarJanela(inicio, inicio, regraDeAluno, AGORA)).toThrow(RegraDeNegocioException);
  });

  it('recusa fim anterior ao início', () => {
    expect(() => validarJanela(inicio, somarMinutos(inicio, -30), regraDeAluno, AGORA)).toThrow(RegraDeNegocioException);
  });

  it('recusa início no passado', () => {
    const passado = somarMinutos(AGORA, -1);
    expect(() => validarJanela(passado, somarMinutos(passado, 30), regraDeAluno, AGORA)).toThrow(RegraDeNegocioException);
  });

  it('aceita início exatamente agora', () => {
    expect(() => validarJanela(AGORA, somarMinutos(AGORA, 30), regraDeAluno, AGORA)).not.toThrow();
  });

  it('aceita início exatamente no limite de antecedência', () => {
    const limite = somarDias(AGORA, LIMITE_DE_TRINTA_DIAS);
    expect(() => validarJanela(limite, somarMinutos(limite, 30), regraDeAluno, AGORA)).not.toThrow();
  });

  it('recusa início um minuto além do limite de antecedência', () => {
    const alem = somarMinutos(somarDias(AGORA, LIMITE_DE_TRINTA_DIAS), 1);
    expect(() => validarJanela(alem, somarMinutos(alem, 30), regraDeAluno, AGORA)).toThrow(RegraDeNegocioException);
  });

  it('respeita a antecedência mínima configurada', () => {
    const regra = { ...regraSemLimites, antecedenciaMinimaMinutos: 1440 };
    const amanhaMenosUmMinuto = somarMinutos(AGORA, 1439);
    expect(() => validarJanela(amanhaMenosUmMinuto, somarMinutos(amanhaMenosUmMinuto, 30), regra, AGORA)).toThrow(RegraDeNegocioException);
  });
});
