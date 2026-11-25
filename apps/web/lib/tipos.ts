export type Perfil = 'ALUNO' | 'PROFESSOR' | 'ADMIN';
export type StatusReserva = 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'CANCELADA';

export type Usuario = { id: number; nome: string; email: string; perfil: Perfil; ativo?: boolean };

export type Laboratorio = {
  id: number;
  nome: string;
  tipo: string;
  capacidade: number;
  recursos: string;
  abertura: string;
  fechamento: string;
  ativo: boolean;
};

export type Reserva = {
  id: number;
  laboratorioId: number;
  inicio: string;
  fim: string;
  finalidade: string;
  status: StatusReserva;
  justificativa: string | null;
};

export type ReservaDoUsuario = Reserva & { laboratorio: { id: number; nome: string } };

export type ReservaPendente = Reserva & { usuario: { nome: string; perfil: Perfil }; laboratorio: { nome: string } };

export type EventoDeAgenda = {
  tipo: 'reserva' | 'bloqueio';
  id: number;
  inicio: string;
  fim: string;
  situacao: string;
  descricao: string;
  minha: boolean;
};
