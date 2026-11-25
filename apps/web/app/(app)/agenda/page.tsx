'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AgendaSemanal } from '@/components/AgendaSemanal';
import { Botao } from '@/components/ui/Botao';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { Selecao } from '@/components/ui/Campo';
import { useApi } from '@/hooks/useApi';
import { diaCurto } from '@/lib/formatacao';
import { inicioDaSemana, somarDias } from '@/lib/semana';
import type { EventoDeAgenda, Laboratorio } from '@/lib/tipos';

const DIAS_DA_SEMANA_LETIVA = 6;

export default function Agenda() {
  const roteador = useRouter();
  const [escolhido, setEscolhido] = useState<string>('');
  const [semana, setSemana] = useState(() => inicioDaSemana(new Date()));
  const laboratorios = useApi<Laboratorio[]>('/laboratorios');

  const laboratorio = laboratorios.dados?.find((lab) => String(lab.id) === escolhido) ?? laboratorios.dados?.[0] ?? null;
  const fim = useMemo(() => somarDias(semana, DIAS_DA_SEMANA_LETIVA + 1), [semana]);
  const caminho = laboratorio
    ? `/agenda?laboratorioId=${laboratorio.id}&de=${encodeURIComponent(semana.toISOString())}&ate=${encodeURIComponent(fim.toISOString())}`
    : null;
  const eventos = useApi<EventoDeAgenda[]>(caminho);

  const escolherHorario = (inicio: Date) => {
    const parametros = new URLSearchParams({ laboratorio: String(laboratorio?.id), inicio: inicio.toISOString() });
    roteador.push(`/reservas/nova?${parametros}`);
  };

  return (
    <Cartao
      titulo="Agenda semanal"
      acoes={
        <div className="flex items-center gap-2">
          <Botao variante="secundario" tamanho="sm" onClick={() => setSemana((atual) => somarDias(atual, -7))}>
            ‹ Semana anterior
          </Botao>
          <Botao variante="secundario" tamanho="sm" onClick={() => setSemana(inicioDaSemana(new Date()))}>
            Hoje
          </Botao>
          <Botao variante="secundario" tamanho="sm" onClick={() => setSemana((atual) => somarDias(atual, 7))}>
            Próxima semana ›
          </Botao>
        </div>
      }
    >
      <Carga carregando={laboratorios.carregando} erro={laboratorios.erro}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <Selecao
              rotulo="Laboratório"
              value={laboratorio?.id ?? ''}
              aoAlterar={setEscolhido}
              opcoes={(laboratorios.dados ?? []).map((lab) => ({ valor: lab.id, rotulo: `${lab.nome} (${lab.capacidade} lugares)` }))}
            />
          </div>
          <p className="text-sm text-slate-600">
            Semana de {diaCurto(semana)} a {diaCurto(somarDias(semana, DIAS_DA_SEMANA_LETIVA - 1))}
          </p>
        </div>
        <Carga carregando={eventos.carregando} erro={eventos.erro}>
          {laboratorio && (
            <AgendaSemanal
              laboratorio={laboratorio}
              inicioDaSemana={semana}
              eventos={eventos.dados ?? []}
              agora={new Date()}
              aoEscolherHorario={escolherHorario}
            />
          )}
        </Carga>
      </Carga>
    </Cartao>
  );
}
