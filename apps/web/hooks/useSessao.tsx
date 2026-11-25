'use client';

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import type { Usuario } from '@/lib/tipos';
import { useApi } from './useApi';

const SessaoContexto = createContext<Usuario | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const roteador = useRouter();
  const { dados, erro, carregando } = useApi<Usuario>('/auth/me');

  useEffect(() => {
    if (erro) roteador.replace('/login');
  }, [erro, roteador]);

  if (carregando || !dados) return <p className="p-8 text-slate-500">Carregando…</p>;
  return <SessaoContexto.Provider value={dados}>{children}</SessaoContexto.Provider>;
}

export function useSessao(): Usuario {
  const usuario = useContext(SessaoContexto);
  if (!usuario) throw new Error('useSessao fora do SessaoProvider');
  return usuario;
}
