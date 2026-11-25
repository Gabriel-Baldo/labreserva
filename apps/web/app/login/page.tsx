'use client';

import { useRouter } from 'next/navigation';
import { Aviso } from '@/components/ui/Aviso';
import { Botao } from '@/components/ui/Botao';
import { Campo } from '@/components/ui/Campo';
import { useFormulario } from '@/hooks/useFormulario';
import { api } from '@/lib/api';

export default function Login() {
  const roteador = useRouter();
  const { valores, alterar, erro, enviando, submeter } = useFormulario({ email: '', senha: '' }, async (dados) => {
    await api('/auth/login', { method: 'POST', corpo: dados });
    roteador.replace('/agenda');
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submeter} className="w-full max-w-sm space-y-5 rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-marca-700">LabReserva</h1>
          <p className="mt-1 text-sm text-slate-500">Entre com seu e-mail institucional.</p>
        </div>
        <Campo rotulo="E-mail" type="email" autoComplete="username" required value={valores.email} aoAlterar={alterar('email')} />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" required value={valores.senha} aoAlterar={alterar('senha')} />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Botao type="submit" className="w-full" disabled={enviando}>
          Entrar
        </Botao>
      </form>
    </main>
  );
}
