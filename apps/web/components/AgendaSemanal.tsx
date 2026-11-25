'use client';

import type { FC } from 'react';
import { diaCurto, hora, minutosDeHora } from '@/lib/formatacao';
import { ROTULO_NA_AGENDA } from '@/lib/rotulos';
import { comHora, diasDaSemana } from '@/lib/semana';
import type { EventoDeAgenda, Laboratorio } from '@/lib/tipos';

type PropsDaCelula = { inicio: Date; evento?: EventoDeAgenda; aoEscolher: (inicio: Date) => void };

const BASE = 'h-14 w-full rounded px-2 py-1 text-left text-xs leading-tight';

const CelulaLivre: FC<PropsDaCelula> = ({ inicio, aoEscolher }) => (
  <button
    type="button"
    onClick={() => aoEscolher(inicio)}
    aria-label={`Livre, ${diaCurto(inicio)} às ${hora(inicio)}`}
    className={`${BASE} bg-white text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:ring-emerald-400`}
  >
    Livre
  </button>
);

const CelulaPassada: FC<PropsDaCelula> = () => <div className={`${BASE} bg-slate-100 text-slate-300`} aria-hidden="true" />;

const CelulaReservada: FC<PropsDaCelula> = ({ evento }) => (
  <div className={`${BASE} bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-300`}>
    <strong className="block">{ROTULO_NA_AGENDA.reservada[String(Boolean(evento?.minha)) as 'true' | 'false']}</strong>
    <span className="line-clamp-2">{evento?.descricao}</span>
  </div>
);

const CelulaPendente: FC<PropsDaCelula> = ({ evento }) => (
  <div className={`${BASE} bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300`}>
    <strong className="block">{ROTULO_NA_AGENDA.pendente[String(Boolean(evento?.minha)) as 'true' | 'false']}</strong>
    <span className="line-clamp-2">{evento?.descricao}</span>
  </div>
);

const CelulaBloqueada: FC<PropsDaCelula> = ({ evento }) => (
  <div className={`${BASE} bg-rose-100 text-rose-900 ring-1 ring-inset ring-rose-300`}>
    <strong className="block">Indisponível</strong>
    <span className="line-clamp-2">{evento?.descricao}</span>
  </div>
);

const CELULAS: Record<string, FC<PropsDaCelula>> = {
  LIVRE: CelulaLivre,
  PASSADO: CelulaPassada,
  APROVADA: CelulaReservada,
  PENDENTE: CelulaPendente,
  BLOQUEIO: CelulaBloqueada,
};

const LEGENDA = [
  { rotulo: 'Livre', classe: 'bg-white ring-slate-300' },
  { rotulo: 'Reservado', classe: 'bg-sky-100 ring-sky-300' },
  { rotulo: 'Pendente', classe: 'bg-amber-100 ring-amber-300' },
  { rotulo: 'Indisponível', classe: 'bg-rose-100 ring-rose-300' },
];

type Props = {
  laboratorio: Laboratorio;
  inicioDaSemana: Date;
  eventos: EventoDeAgenda[];
  agora: Date;
  aoEscolherHorario: (inicio: Date) => void;
};

const situacaoDo = (inicio: Date, fim: Date, eventos: EventoDeAgenda[], agora: Date) => {
  const evento = eventos.find((candidato) => new Date(candidato.inicio) < fim && new Date(candidato.fim) > inicio);
  const livreOuPassado = inicio < agora ? 'PASSADO' : 'LIVRE';
  return { evento, situacao: evento?.situacao ?? livreOuPassado };
};

export function AgendaSemanal({ laboratorio, inicioDaSemana, eventos, agora, aoEscolherHorario }: Props) {
  const dias = diasDaSemana(inicioDaSemana);
  const primeiraHora = Math.floor(minutosDeHora(laboratorio.abertura) / 60);
  const ultimaHora = Math.ceil(minutosDeHora(laboratorio.fechamento) / 60);
  const horas = Array.from({ length: ultimaHora - primeiraHora }, (_, indice) => primeiraHora + indice);

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600" aria-label="Legenda">
        {LEGENDA.map((item) => (
          <li key={item.rotulo} className="flex items-center gap-2">
            <span className={`h-3 w-5 rounded ring-1 ring-inset ${item.classe}`} />
            {item.rotulo}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-16" />
              {dias.map((dia) => (
                <th key={dia.toISOString()} scope="col" className="pb-1 text-center font-semibold capitalize text-slate-700">
                  {diaCurto(dia)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((horas_) => (
              <tr key={horas_}>
                <th scope="row" className="pr-2 text-right text-xs font-medium text-slate-500">
                  {String(horas_).padStart(2, '0')}:00
                </th>
                {dias.map((dia) => {
                  const inicio = comHora(dia, horas_);
                  const fim = comHora(dia, horas_ + 1);
                  const { evento, situacao } = situacaoDo(inicio, fim, eventos, agora);
                  const Celula = CELULAS[situacao];
                  return (
                    <td key={dia.toISOString()} className="p-0">
                      <Celula inicio={inicio} evento={evento} aoEscolher={aoEscolherHorario} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
