'use client';

import { useState } from 'react';
import { ConfirmacaoDeAcao } from '@/components/ConfirmacaoDeAcao';
import { Abas } from '@/components/ui/Abas';
import { Botao } from '@/components/ui/Botao';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { EtiquetaDeStatus } from '@/components/ui/Etiqueta';
import { Coluna, Tabela } from '@/components/ui/Tabela';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { intervalo } from '@/lib/formatacao';
import type { ReservaDoUsuario } from '@/lib/tipos';

const ABAS = [
  { valor: 'futuras', rotulo: 'Futuras' },
  { valor: 'passadas', rotulo: 'Passadas' },
] as const;

type Aba = (typeof ABAS)[number]['valor'];

const FILTROS: Record<Aba, (reserva: ReservaDoUsuario, agora: number) => boolean> = {
  futuras: (reserva, agora) => new Date(reserva.fim).getTime() >= agora,
  passadas: (reserva, agora) => new Date(reserva.fim).getTime() < agora,
};

const PODE_CANCELAR = ['PENDENTE', 'APROVADA'];

export default function MinhasReservas() {
  const [aba, setAba] = useState<Aba>('futuras');
  const [alvo, setAlvo] = useState<ReservaDoUsuario | null>(null);
  const reservas = useApi<ReservaDoUsuario[]>('/reservas/minhas');
  const agora = Date.now();
  const visiveis = (reservas.dados ?? []).filter((reserva) => FILTROS[aba](reserva, agora));

  const colunas: Coluna<ReservaDoUsuario>[] = [
    { titulo: 'Laboratório', celula: (reserva) => <span className="font-medium">{reserva.laboratorio.nome}</span> },
    { titulo: 'Quando', celula: (reserva) => intervalo(reserva.inicio, reserva.fim) },
    { titulo: 'Finalidade', celula: (reserva) => reserva.finalidade },
    {
      titulo: 'Situação',
      celula: (reserva) => (
        <div className="space-y-1">
          <EtiquetaDeStatus status={reserva.status} />
          {reserva.justificativa && <p className="max-w-xs text-xs text-slate-600">Motivo: {reserva.justificativa}</p>}
        </div>
      ),
    },
    {
      titulo: '',
      celula: (reserva) =>
        PODE_CANCELAR.includes(reserva.status) && aba === 'futuras' ? (
          <Botao variante="secundario" tamanho="sm" onClick={() => setAlvo(reserva)}>
            Cancelar
          </Botao>
        ) : null,
    },
  ];

  return (
    <Cartao titulo="Minhas reservas">
      <div className="space-y-4">
        <Abas abas={[...ABAS]} ativa={aba} aoEscolher={setAba} />
        <Carga carregando={reservas.carregando} erro={reservas.erro}>
          <Tabela dados={visiveis} colunas={colunas} chave={(reserva) => reserva.id} vazio="Nenhuma reserva nesta lista." />
        </Carga>
      </div>
      {alvo && (
        <ConfirmacaoDeAcao
          titulo="Cancelar reserva"
          rotuloConfirmar="Cancelar reserva"
          mensagem={`Deseja cancelar a reserva de ${alvo.laboratorio.nome}, ${intervalo(alvo.inicio, alvo.fim)}? O horário voltará a ficar livre.`}
          aoConfirmar={async () => {
            await api(`/reservas/${alvo.id}/cancelar`, { method: 'POST' });
            reservas.recarregar();
          }}
          aoFechar={() => setAlvo(null)}
        />
      )}
    </Cartao>
  );
}
