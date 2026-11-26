import { Perfil, PrismaClient, StatusReserva } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DESLOCAMENTO_UTC = process.env.SEED_UTC_OFFSET ?? '-03:00';
const DIA_EM_MS = 86_400_000;

const REGRAS = [
  { perfil: Perfil.ALUNO, statusInicial: StatusReserva.PENDENTE, duracaoMaximaMinutos: 120, antecedenciaMaximaDias: 30, antecedenciaMinimaMinutos: 0 },
  { perfil: Perfil.PROFESSOR, statusInicial: StatusReserva.APROVADA, duracaoMaximaMinutos: null, antecedenciaMaximaDias: 30, antecedenciaMinimaMinutos: 0 },
  { perfil: Perfil.ADMIN, statusInicial: StatusReserva.APROVADA, duracaoMaximaMinutos: null, antecedenciaMaximaDias: null, antecedenciaMinimaMinutos: 0 },
];

const CONFIGURACOES = [
  { chave: 'auth.maxTentativas', valor: '5' },
  { chave: 'auth.bloqueioMinutos', valor: '15' },
  { chave: 'cancelamento.antecedenciaMinimaMinutos', valor: '60' },
  { chave: 'fusoHorario', valor: 'America/Sao_Paulo' },
];

const USUARIOS = [
  { nome: 'Helena Duarte', email: 'admin@labreserva.local', perfil: Perfil.ADMIN },
  { nome: 'Prof. Ricardo Menezes', email: 'professor@labreserva.local', perfil: Perfil.PROFESSOR },
  { nome: 'Gabriel Baldo', email: 'aluno@labreserva.local', perfil: Perfil.ALUNO },
  { nome: 'Camila Ferreira', email: 'aluna@labreserva.local', perfil: Perfil.ALUNO },
];

const LABORATORIOS = [
  { nome: 'Laboratório de Redes', tipo: 'Informática', capacidade: 30, recursos: 'Switches, roteadores e 30 computadores', abertura: '07:00', fechamento: '22:00' },
  { nome: 'Laboratório de Software', tipo: 'Informática', capacidade: 40, recursos: '40 computadores e projetor', abertura: '07:00', fechamento: '22:00' },
  { nome: 'Laboratório de Hardware', tipo: 'Eletrônica', capacidade: 20, recursos: 'Bancadas, osciloscópios e kits de montagem', abertura: '08:00', fechamento: '18:00' },
];

const diaLocal = (deslocamentoEmDias: number): string =>
  new Date(Date.now() + deslocamentoEmDias * DIA_EM_MS).toISOString().slice(0, 10);

const instante = (deslocamentoEmDias: number, hora: string): Date =>
  new Date(`${diaLocal(deslocamentoEmDias)}T${hora}:00${DESLOCAMENTO_UTC}`);

async function semear() {
  const senha = process.env.SEED_PASSWORD;
  if (!senha) throw new Error('SEED_PASSWORD não definida');
  const senhaHash = await bcrypt.hash(senha, 10);

  await Promise.all(REGRAS.map((regra) => prisma.regraPerfil.upsert({ where: { perfil: regra.perfil }, update: regra, create: regra })));
  await Promise.all(CONFIGURACOES.map((c) => prisma.configuracao.upsert({ where: { chave: c.chave }, update: { valor: c.valor }, create: c })));
  for (const u of USUARIOS) await prisma.usuario.upsert({ where: { email: u.email }, update: { senhaHash, ativo: true, tentativasFalhas: 0, bloqueadoAte: null }, create: { ...u, senhaHash } });
  for (const l of LABORATORIOS) await prisma.laboratorio.upsert({ where: { nome: l.nome }, update: {}, create: l });

  if ((await prisma.reserva.count()) > 0) return;

  const [admin, professor, aluno, aluna] = await Promise.all(USUARIOS.map((u) => prisma.usuario.findUniqueOrThrow({ where: { email: u.email } })));
  const [redes, software] = await Promise.all(LABORATORIOS.slice(0, 2).map((l) => prisma.laboratorio.findUniqueOrThrow({ where: { nome: l.nome } })));

  const reservas = [
    { usuario: aluno, lab: redes, dia: -1, de: '14:00', ate: '16:00', status: StatusReserva.APROVADA, finalidade: 'Estudo em grupo de roteamento' },
    { usuario: professor, lab: redes, dia: 1, de: '08:00', ate: '10:00', status: StatusReserva.APROVADA, finalidade: 'Aula prática de Redes de Computadores' },
    { usuario: aluno, lab: redes, dia: 1, de: '14:00', ate: '16:00', status: StatusReserva.PENDENTE, finalidade: 'Estudo em grupo para a prova' },
    { usuario: professor, lab: redes, dia: 2, de: '10:00', ate: '12:00', status: StatusReserva.APROVADA, finalidade: 'Aula de Sistemas Operacionais' },
    { usuario: aluna, lab: redes, dia: 2, de: '14:00', ate: '15:30', status: StatusReserva.PENDENTE, finalidade: 'Monitoria de Algoritmos e Estrutura de Dados' },
    { usuario: professor, lab: redes, dia: 3, de: '19:00', ate: '21:00', status: StatusReserva.APROVADA, finalidade: 'Aula de Arquitetura de Software' },
    { usuario: professor, lab: software, dia: 2, de: '08:00', ate: '12:00', status: StatusReserva.APROVADA, finalidade: 'Prova prática de Programação' },
  ];

  await Promise.all(
    reservas.map((r) =>
      prisma.reserva.create({
        data: {
          usuarioId: r.usuario.id,
          laboratorioId: r.lab.id,
          inicio: instante(r.dia, r.de),
          fim: instante(r.dia, r.ate),
          status: r.status,
          finalidade: r.finalidade,
          decididoPor: r.status === StatusReserva.APROVADA ? admin.id : null,
          decididoEm: r.status === StatusReserva.APROVADA ? new Date() : null,
        },
      }),
    ),
  );

  await prisma.bloqueio.create({
    data: { laboratorioId: redes.id, criadoPor: admin.id, inicio: instante(3, '08:00'), fim: instante(3, '12:00'), motivo: 'Manutenção dos switches' },
  });
}

semear()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
