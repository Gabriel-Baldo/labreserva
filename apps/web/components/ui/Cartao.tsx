import type { ReactNode } from 'react';

type Props = { titulo?: string; acoes?: ReactNode; children: ReactNode; className?: string };

export function Cartao({ titulo, acoes, children, className = '' }: Props) {
  return (
    <section className={`rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        {acoes}
      </header>
      {children}
    </section>
  );
}
