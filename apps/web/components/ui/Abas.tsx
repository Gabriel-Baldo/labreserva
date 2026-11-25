type Aba<V extends string> = { valor: V; rotulo: string };

type Props<V extends string> = { abas: Aba<V>[]; ativa: V; aoEscolher: (valor: V) => void };

const ESTILO = { true: 'border-marca-600 text-marca-700', false: 'border-transparent text-slate-500 hover:text-slate-700' };

export function Abas<V extends string>({ abas, ativa, aoEscolher }: Props<V>) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-slate-200">
      {abas.map((aba) => (
        <button
          key={aba.valor}
          role="tab"
          type="button"
          aria-selected={aba.valor === ativa}
          onClick={() => aoEscolher(aba.valor)}
          className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${ESTILO[String(aba.valor === ativa) as 'true' | 'false']}`}
        >
          {aba.rotulo}
        </button>
      ))}
    </div>
  );
}
