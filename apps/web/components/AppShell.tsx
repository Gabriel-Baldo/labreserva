'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSessao } from '@/hooks/useSessao';
import { api } from '@/lib/api';
import { NAVEGACAO, ROTULO_PERFIL } from '@/lib/rotulos';
import { Botao } from './ui/Botao';

const ESTILO_DO_LINK = {
  true: 'bg-marca-50 text-marca-700',
  false: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

const ehAtivo = (caminhoAtual: string, caminho: string, todos: string[]): boolean => {
  const maisEspecificos = todos.filter((outro) => outro.length > caminho.length && caminhoAtual.startsWith(outro));
  return caminhoAtual.startsWith(caminho) && maisEspecificos.length === 0;
};

export function AppShell({ children }: { children: ReactNode }) {
  const usuario = useSessao();
  const caminhoAtual = usePathname();
  const roteador = useRouter();
  const itens = NAVEGACAO[usuario.perfil];
  const caminhos = itens.map((item) => item.caminho);

  const sair = async () => {
    await api('/auth/logout', { method: 'POST' });
    roteador.replace('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-bold text-marca-700">LabReserva</span>
            <nav aria-label="Principal" className="flex flex-wrap gap-1">
              {itens.map((item) => (
                <Link
                  key={item.caminho}
                  href={item.caminho}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${ESTILO_DO_LINK[String(ehAtivo(caminhoAtual, item.caminho, caminhos)) as 'true' | 'false']}`}
                >
                  {item.rotulo}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">
              {usuario.nome} <span className="text-slate-400">({ROTULO_PERFIL[usuario.perfil]})</span>
            </span>
            <Botao variante="secundario" tamanho="sm" onClick={sair}>
              Sair
            </Botao>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}
