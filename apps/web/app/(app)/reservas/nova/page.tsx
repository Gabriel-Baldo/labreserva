'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Botao } from '@/components/ui/Botao';
import { Campo, Selecao } from '@/components/ui/Campo';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { EtiquetaDeStatus } from '@/components/ui/Etiqueta';
import { useApi } from '@/hooks/useApi';
import { useFormulario } from '@/hooks/useFormulario';
import { api } from '@/lib/api';
import { intervalo, paraIso } from '@/lib/formatacao';
import { MENSAGEM_DE_CONFIRMACAO } from '@/lib/rotulos';
import { dataParaCampo, horaParaCampo } from '@/lib/semana';
import type { Laboratorio, Reserva } from '@/lib/tipos';

const DURACAO_SUGERIDA_EM_MINUTOS = 60;

const valoresIniciais = (parametros: URLSearchParams) => {
  const inicio = new Date(parametros.get('inicio') ?? Date.now());
  const fim = new Date(inicio.getTime() + DURACAO_SUGERIDA_EM_MINUTOS * 60_000);
  return {
    laboratorioId: parametros.get('laboratorio') ?? '',
    data: dataParaCampo(inicio),
    inicio: horaParaCampo(inicio),
    fim: horaParaCampo(fim),
    finalidade: '',
  };
};

function Formulario() {
  const parametros = useSearchParams();
  const laboratorios = useApi<Laboratorio[]>('/laboratorios');
  const [criada, setCriada] = useState<(Reserva & { laboratorioNome: string }) | null>(null);

  const { valores, alterar, erro, enviando, submeter } = useFormulario(valoresIniciais(parametros), async (dados) => {
    const laboratorioId = Number(dados.laboratorioId || laboratorios.dados?.[0]?.id);
    const reserva = await api<Reserva>('/reservas', {
      method: 'POST',
      corpo: { laboratorioId, inicio: paraIso(dados.data, dados.inicio), fim: paraIso(dados.data, dados.fim), finalidade: dados.finalidade },
    });
    const nome = laboratorios.dados?.find((lab) => lab.id === laboratorioId)?.nome ?? '';
    setCriada({ ...reserva, laboratorioNome: nome });
  });

  if (criada) {
    return (
      <Cartao titulo="Reserva registrada">
        <div className="space-y-4 text-sm">
          <Aviso tipo="sucesso">
            {MENSAGEM_DE_CONFIRMACAO[criada.status]}
          </Aviso>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
            <dt className="text-slate-500">Laboratório</dt>
            <dd className="font-medium">{criada.laboratorioNome}</dd>
            <dt className="text-slate-500">Quando</dt>
            <dd className="font-medium">{intervalo(criada.inicio, criada.fim)}</dd>
            <dt className="text-slate-500">Finalidade</dt>
            <dd className="font-medium">{criada.finalidade}</dd>
            <dt className="text-slate-500">Situação</dt>
            <dd>
              <EtiquetaDeStatus status={criada.status} />
            </dd>
          </dl>
          <div className="flex gap-2">
            <Link href="/reservas" className="rounded-md bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700">
              Ver minhas reservas
            </Link>
            <Botao variante="secundario" onClick={() => setCriada(null)}>
              Nova reserva
            </Botao>
          </div>
        </div>
      </Cartao>
    );
  }

  return (
    <Cartao titulo="Solicitar reserva">
      <Carga carregando={laboratorios.carregando} erro={laboratorios.erro}>
        <form onSubmit={submeter} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Selecao
              rotulo="Laboratório"
              value={valores.laboratorioId || laboratorios.dados?.[0]?.id}
              aoAlterar={alterar('laboratorioId')}
              opcoes={(laboratorios.dados ?? []).map((lab) => ({ valor: lab.id, rotulo: `${lab.nome} (${lab.abertura} às ${lab.fechamento})` }))}
            />
          </div>
          <Campo rotulo="Data" type="date" required value={valores.data} aoAlterar={alterar('data')} />
          <div className="grid grid-cols-2 gap-4">
            <Campo rotulo="Início" type="time" required value={valores.inicio} aoAlterar={alterar('inicio')} />
            <Campo rotulo="Fim" type="time" required value={valores.fim} aoAlterar={alterar('fim')} />
          </div>
          <div className="sm:col-span-2">
            <Campo rotulo="Finalidade" required maxLength={200} placeholder="Ex.: aula prática, monitoria, estudo em grupo" value={valores.finalidade} aoAlterar={alterar('finalidade')} />
          </div>
          {erro && (
            <div className="sm:col-span-2">
              <Aviso tipo="erro">{erro}</Aviso>
            </div>
          )}
          <div className="sm:col-span-2">
            <Botao type="submit" disabled={enviando}>
              Solicitar reserva
            </Botao>
          </div>
        </form>
      </Carga>
    </Cartao>
  );
}

export default function NovaReserva() {
  return (
    <Suspense fallback={<p className="text-slate-500">Carregando…</p>}>
      <Formulario />
    </Suspense>
  );
}
