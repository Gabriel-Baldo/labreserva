'use client';

import { useState } from 'react';
import { ConfirmacaoDeAcao } from '@/components/ConfirmacaoDeAcao';
import { Aviso } from '@/components/ui/Aviso';
import { Botao } from '@/components/ui/Botao';
import { Campo, Selecao } from '@/components/ui/Campo';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { Janela } from '@/components/ui/Janela';
import { Coluna, Tabela } from '@/components/ui/Tabela';
import { useApi } from '@/hooks/useApi';
import { useFormulario } from '@/hooks/useFormulario';
import { api } from '@/lib/api';
import { ROTULO_PERFIL } from '@/lib/rotulos';
import type { Perfil, Usuario } from '@/lib/tipos';

const OPCOES_DE_PERFIL = (Object.keys(ROTULO_PERFIL) as Perfil[]).map((perfil) => ({ valor: perfil, rotulo: ROTULO_PERFIL[perfil] }));

function NovoUsuario({ aoConcluir, aoFechar }: { aoConcluir: () => void; aoFechar: () => void }) {
  const { valores, alterar, erro, enviando, submeter } = useFormulario(
    { nome: '', email: '', senha: '', perfil: 'ALUNO' },
    async (dados) => {
      await api('/usuarios', { method: 'POST', corpo: dados });
      aoConcluir();
    },
  );

  return (
    <Janela titulo="Novo usuário" aoFechar={aoFechar}>
      <form onSubmit={submeter} className="space-y-4">
        <Campo rotulo="Nome" required value={valores.nome} aoAlterar={alterar('nome')} />
        <Campo rotulo="E-mail" type="email" required value={valores.email} aoAlterar={alterar('email')} />
        <Campo rotulo="Senha inicial (mínimo de 8 caracteres)" type="password" minLength={8} required autoComplete="new-password" value={valores.senha} aoAlterar={alterar('senha')} />
        <Selecao rotulo="Perfil" value={valores.perfil} aoAlterar={alterar('perfil')} opcoes={OPCOES_DE_PERFIL} />
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>
            Voltar
          </Botao>
          <Botao type="submit" disabled={enviando}>
            Cadastrar
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

export default function Usuarios() {
  const usuarios = useApi<Usuario[]>('/usuarios');
  const [criando, setCriando] = useState(false);
  const [desativando, setDesativando] = useState<Usuario | null>(null);

  const colunas: Coluna<Usuario>[] = [
    { titulo: 'Nome', celula: (usuario) => <span className="font-medium">{usuario.nome}</span> },
    { titulo: 'E-mail', celula: (usuario) => usuario.email },
    { titulo: 'Perfil', celula: (usuario) => ROTULO_PERFIL[usuario.perfil] },
    {
      titulo: '',
      celula: (usuario) => (
        <Botao tamanho="sm" variante="secundario" onClick={() => setDesativando(usuario)}>
          Desativar
        </Botao>
      ),
    },
  ];

  return (
    <Cartao
      titulo="Usuários"
      acoes={
        <Botao tamanho="sm" onClick={() => setCriando(true)}>
          Novo usuário
        </Botao>
      }
    >
      <Carga carregando={usuarios.carregando} erro={usuarios.erro}>
        <Tabela dados={usuarios.dados ?? []} colunas={colunas} chave={(usuario) => usuario.id} vazio="Nenhum usuário cadastrado." />
      </Carga>
      {criando && (
        <NovoUsuario
          aoConcluir={() => {
            setCriando(false);
            usuarios.recarregar();
          }}
          aoFechar={() => setCriando(false)}
        />
      )}
      {desativando && (
        <ConfirmacaoDeAcao
          titulo="Desativar usuário"
          rotuloConfirmar="Desativar"
          mensagem={`${desativando.nome} não conseguirá mais entrar no sistema. O histórico de reservas será mantido.`}
          aoConfirmar={async () => {
            await api(`/usuarios/${desativando.id}/desativar`, { method: 'POST' });
            usuarios.recarregar();
          }}
          aoFechar={() => setDesativando(null)}
        />
      )}
    </Cartao>
  );
}
