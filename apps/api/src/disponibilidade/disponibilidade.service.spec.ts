import { NotFoundException } from '@nestjs/common';
import { ConflitoDeHorarioException, RegraDeNegocioException } from '../common/excecoes';
import { ConfiguracaoService } from '../configuracao/configuracao.service';
import { Banco, DisponibilidadeService } from './disponibilidade.service';

const FUSO = 'America/Sao_Paulo';
const DESLOCAMENTO = '-03:00';
const LABORATORIO = { id: 1, ativo: true, abertura: '08:00', fechamento: '18:00' };

const instante = (hora: string) => new Date(`2026-12-10T${hora}:00${DESLOCAMENTO}`);

const montar = (opcoes: { laboratorio?: object | null; reserva?: object | null; bloqueio?: object | null } = {}) => {
  const banco = {
    laboratorio: { findUnique: jest.fn().mockResolvedValue(opcoes.laboratorio === undefined ? LABORATORIO : opcoes.laboratorio) },
    reserva: { findFirst: jest.fn().mockResolvedValue(opcoes.reserva ?? null) },
    bloqueio: { findFirst: jest.fn().mockResolvedValue(opcoes.bloqueio ?? null) },
  };
  const configuracao = { texto: jest.fn().mockResolvedValue(FUSO) } as unknown as ConfiguracaoService;
  return { banco: banco as unknown as Banco, bruto: banco, servico: new DisponibilidadeService(configuracao) };
};

const periodo = (de: string, ate: string) => ({ laboratorioId: 1, inicio: instante(de), fim: instante(ate) });

describe('DisponibilidadeService', () => {
  it('aceita horário livre dentro do funcionamento', async () => {
    const { banco, servico } = montar();
    await expect(servico.verificar(banco, periodo('09:00', '10:00'))).resolves.toBeUndefined();
  });

  it('aceita reserva que começa exatamente na abertura e termina exatamente no fechamento', async () => {
    const { banco, servico } = montar();
    await expect(servico.verificar(banco, periodo('08:00', '18:00'))).resolves.toBeUndefined();
  });

  it('recusa começar um minuto antes da abertura', async () => {
    const { banco, servico } = montar();
    await expect(servico.verificar(banco, periodo('07:59', '09:00'))).rejects.toBeInstanceOf(RegraDeNegocioException);
  });

  it('recusa terminar um minuto depois do fechamento', async () => {
    const { banco, servico } = montar();
    await expect(servico.verificar(banco, periodo('17:00', '18:01'))).rejects.toBeInstanceOf(RegraDeNegocioException);
  });

  it('recusa período que atravessa a meia-noite', async () => {
    const { banco, servico } = montar();
    const atravessa = { laboratorioId: 1, inicio: instante('17:00'), fim: new Date(`2026-12-11T01:00:00${DESLOCAMENTO}`) };
    await expect(servico.verificar(banco, atravessa)).rejects.toBeInstanceOf(RegraDeNegocioException);
  });

  it('recusa quando há reserva ativa sobreposta', async () => {
    const { banco, servico } = montar({ reserva: { id: 9 } });
    await expect(servico.verificar(banco, periodo('09:00', '10:00'))).rejects.toBeInstanceOf(ConflitoDeHorarioException);
  });

  it('recusa quando há bloqueio sobreposto', async () => {
    const { banco, servico } = montar({ bloqueio: { id: 3 } });
    await expect(servico.verificar(banco, periodo('09:00', '10:00'))).rejects.toBeInstanceOf(ConflitoDeHorarioException);
  });

  it('consulta sobreposição com limites estritos, de modo que períodos que só se encostam não conflitam', async () => {
    const { banco, bruto, servico } = montar();
    const pedido = periodo('09:00', '10:00');
    await servico.verificar(banco, pedido);
    const filtro = bruto.reserva.findFirst.mock.calls[0][0].where;
    expect(filtro.inicio).toEqual({ lt: pedido.fim });
    expect(filtro.fim).toEqual({ gt: pedido.inicio });
  });

  it('ignora a própria reserva ao reverificar', async () => {
    const { banco, bruto, servico } = montar();
    await servico.verificar(banco, { ...periodo('09:00', '10:00'), ignorarReservaId: 7 });
    expect(bruto.reserva.findFirst.mock.calls[0][0].where.id).toEqual({ not: 7 });
  });

  it('recusa laboratório desativado', async () => {
    const { banco, servico } = montar({ laboratorio: { ...LABORATORIO, ativo: false } });
    await expect(servico.verificar(banco, periodo('09:00', '10:00'))).rejects.toBeInstanceOf(RegraDeNegocioException);
  });

  it('falha quando o laboratório não existe', async () => {
    const { banco, servico } = montar({ laboratorio: null });
    await expect(servico.verificar(banco, periodo('09:00', '10:00'))).rejects.toBeInstanceOf(NotFoundException);
  });
});
