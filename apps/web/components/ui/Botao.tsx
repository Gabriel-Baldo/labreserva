import type { ButtonHTMLAttributes } from 'react';

const VARIANTES = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 focus-visible:outline-marca-600',
  secundario: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-500',
  perigo: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600',
  fantasma: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500',
};

const TAMANHOS = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES;
  tamanho?: keyof typeof TAMANHOS;
};

export function Botao({ variante = 'primario', tamanho = 'md', className = '', type = 'button', ...resto }: Props) {
  const classes = `inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`;
  return <button type={type} className={classes} {...resto} />;
}
