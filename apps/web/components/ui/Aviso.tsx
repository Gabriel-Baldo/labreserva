import type { ReactNode } from 'react';

const ESTILOS = {
  erro: 'bg-rose-50 text-rose-900 ring-rose-200',
  sucesso: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  info: 'bg-sky-50 text-sky-900 ring-sky-200',
};

const PAPEL = { erro: 'alert', sucesso: 'status', info: 'status' } as const;

export function Aviso({ tipo = 'info', children }: { tipo?: keyof typeof ESTILOS; children: ReactNode }) {
  return (
    <div role={PAPEL[tipo]} className={`rounded-md px-4 py-3 text-sm ring-1 ring-inset ${ESTILOS[tipo]}`}>
      {children}
    </div>
  );
}
