import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const CONTROLE =
  'mt-1 block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-marca-600';

type CampoProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  rotulo: string;
  aoAlterar: (valor: string) => void;
};

export function Campo({ rotulo, aoAlterar, id, ...resto }: CampoProps) {
  const identificador = id ?? `campo-${rotulo}`;
  return (
    <div>
      <label htmlFor={identificador} className="block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <input id={identificador} className={CONTROLE} onChange={(evento) => aoAlterar(evento.target.value)} {...resto} />
    </div>
  );
}

type Opcao = { valor: string | number; rotulo: ReactNode };

type SelecaoProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  rotulo: string;
  opcoes: Opcao[];
  aoAlterar: (valor: string) => void;
};

export function Selecao({ rotulo, opcoes, aoAlterar, id, ...resto }: SelecaoProps) {
  const identificador = id ?? `selecao-${rotulo}`;
  return (
    <div>
      <label htmlFor={identificador} className="block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <select id={identificador} className={CONTROLE} onChange={(evento) => aoAlterar(evento.target.value)} {...resto}>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
