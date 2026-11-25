'use client';

import { ReactNode, useEffect } from 'react';

type Props = { titulo: string; aoFechar: () => void; children: ReactNode };

export function Janela({ titulo, aoFechar, children }: Props) {
  useEffect(() => {
    const aoPressionar = (evento: KeyboardEvent) => evento.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', aoPressionar);
    return () => window.removeEventListener('keydown', aoPressionar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
