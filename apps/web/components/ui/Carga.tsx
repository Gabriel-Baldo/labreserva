import type { ReactNode } from 'react';
import { Aviso } from './Aviso';

type Props = { carregando: boolean; erro: string | null; children: ReactNode };

export function Carga({ carregando, erro, children }: Props) {
  if (carregando) return <p className="py-6 text-center text-sm text-slate-500">Carregando…</p>;
  if (erro) return <Aviso tipo="erro">{erro}</Aviso>;
  return <>{children}</>;
}
