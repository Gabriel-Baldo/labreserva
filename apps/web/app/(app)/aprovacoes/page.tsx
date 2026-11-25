'use client';

import { useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Botao } from '@/components/ui/Botao';
import { Campo } from '@/components/ui/Campo';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { Janela } from '@/components/ui/Janela';
import { Coluna, Tabela } from '@/components/ui/Tabela';
import { useApi } from '@/hooks/useApi';
import { useFormulario } from '@/hooks/useFormulario';
import { api } from '@/lib/api';
import { intervalo } from '@/lib/formatacao';
import { ROTULO_PERFIL } from '@/lib/rotulos';
import type { ReservaPendente } from '@/lib/tipos';

function Recusa({ reserva, aoConcluir, aoFechar }: { reserva: ReservaPendente; aoConcluir: () => void; aoFechar: () => void }) {
  const { valores, alterar, erro, enviando, submeter } = useFormulario({ justificativa: '' }, async (dados) => {
    await api(`/aprovacoes/${reserva.id}/recusar`, { method: 'POST', corpo: dados });
    aoConcluir();
  });

  return (
    <Janela titulo="Recusar solicitação" aoFechar={aoFechar}>
      <form onSubmit={submeter} className="space-y-4">
        <p className="text-sm text-slate-600">
          {reserva.laboratorio.nome}, {intervalo(reserva.inicio, reserva.fim)}, solicitada por {reserva.usuario.nome}.
        </p>
        <Campo rotulo="Justificativa (obrigatória)" required value={valores.justificativa} aoAlterar={alterar('justificativa')} />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>
            Voltar
          </Botao>
          <Botao type="submit" variante="perigo" disabled={enviando}>
            Recusar
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

export default function Aprovacoes() {
  const pendentes = useApi<ReservaPendente[]>('/aprovacoes/pendentes');
  const [recusando, setRecusando] = useState<ReservaPendente | null>(null);
  const [erroDeAcao, setErroDeAcao] = useState<string | null>(null);

  const aprovar = async (reserva: ReservaPendente) => {
    setErroDeAcao(null);
    await api(`/aprovacoes/${reserva.id}/aprovar`, { method: 'POST' })
      .then(pendentes.recarregar)
      .catch((falha: Error) => setErroDeAcao(falha.message));
  };

  const colunas: Coluna<ReservaPendente>[] = [
    { titulo: 'Quando', celula: (reserva) => <span className="font-medium">{intervalo(reserva.inicio, reserva.fim)}</span> },
    { titulo: 'Laboratório', celula: (reserva) => reserva.laboratorio.nome },
    { titulo: 'Solicitante', celula: (reserva) => `${reserva.usuario.nome} (${ROTULO_PERFIL[reserva.usuario.perfil]})` },
    { titulo: 'Finalidade', celula: (reserva) => reserva.finalidade },
    {
      titulo: '',
      celula: (reserva) => (
        <div className="flex gap-2">
          <Botao tamanho="sm" onClick={() => aprovar(reserva)}>
            Aprovar
          </Botao>
          <Botao tamanho="sm" variante="secundario" onClick={() => setRecusando(reserva)}>
            Recusar
          </Botao>
        </div>
      ),
    },
  ];

  return (
    <Cartao titulo="Solicitações pendentes">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Ordenadas pela data da reserva, da mais próxima para a mais distante.</p>
        {erroDeAcao && <Aviso tipo="erro">{erroDeAcao}</Aviso>}
        <Carga carregando={pendentes.carregando} erro={pendentes.erro}>
          <Tabela dados={pendentes.dados ?? []} colunas={colunas} chave={(reserva) => reserva.id} vazio="Nenhuma solicitação aguardando decisão." />
        </Carga>
      </div>
      {recusando && (
        <Recusa
          reserva={recusando}
          aoConcluir={() => {
            setRecusando(null);
            pendentes.recarregar();
          }}
          aoFechar={() => setRecusando(null)}
        />
      )}
    </Cartao>
  );
}
