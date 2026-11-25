import type { ReactNode } from 'react';

export type Coluna<T> = { titulo: string; celula: (linha: T) => ReactNode; className?: string };

type Props<T> = {
  dados: T[];
  colunas: Coluna<T>[];
  chave: (linha: T) => string | number;
  vazio: string;
};

export function Tabela<T>({ dados, colunas, chave, vazio }: Props<T>) {
  if (dados.length === 0) return <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{vazio}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.titulo} scope="col" className="px-3 py-2 text-left font-semibold text-slate-600">
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dados.map((linha) => (
            <tr key={chave(linha)}>
              {colunas.map((coluna) => (
                <td key={coluna.titulo} className={`px-3 py-3 align-top ${coluna.className ?? ''}`}>
                  {coluna.celula(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
