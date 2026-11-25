import type { Perfil, StatusReserva } from './tipos';

export const ROTULO_PERFIL: Record<Perfil, string> = {
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor',
  ADMIN: 'Administrador',
};

export const ROTULO_STATUS: Record<StatusReserva, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
};

export const ESTILO_STATUS: Record<StatusReserva, string> = {
  PENDENTE: 'bg-amber-100 text-amber-900 ring-amber-300',
  APROVADA: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  RECUSADA: 'bg-rose-100 text-rose-900 ring-rose-300',
  CANCELADA: 'bg-slate-200 text-slate-700 ring-slate-300',
};

export const MENSAGEM_DE_CONFIRMACAO: Partial<Record<StatusReserva, string>> = {
  APROVADA: 'Sua reserva foi aprovada automaticamente.',
  PENDENTE: 'Sua solicitação foi enviada e aguarda aprovação do administrador.',
};

export const ROTULO_NA_AGENDA = {
  reservada: { true: 'Minha reserva', false: 'Reservado' },
  pendente: { true: 'Minha, pendente', false: 'Pendente' },
};

export type ItemDeMenu = { rotulo: string; caminho: string };

const COMUNS: ItemDeMenu[] = [
  { rotulo: 'Agenda', caminho: '/agenda' },
  { rotulo: 'Nova reserva', caminho: '/reservas/nova' },
  { rotulo: 'Minhas reservas', caminho: '/reservas' },
];

export const NAVEGACAO: Record<Perfil, ItemDeMenu[]> = {
  ALUNO: COMUNS,
  PROFESSOR: COMUNS,
  ADMIN: [
    ...COMUNS,
    { rotulo: 'Aprovações', caminho: '/aprovacoes' },
    { rotulo: 'Laboratórios', caminho: '/laboratorios' },
    { rotulo: 'Usuários', caminho: '/usuarios' },
  ],
};
