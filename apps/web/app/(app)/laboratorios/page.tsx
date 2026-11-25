'use client';

import { useState } from 'react';
import { ConfirmacaoDeAcao } from '@/components/ConfirmacaoDeAcao';
import { Aviso } from '@/components/ui/Aviso';
import { Botao } from '@/components/ui/Botao';
import { Campo } from '@/components/ui/Campo';
import { Cartao } from '@/components/ui/Cartao';
import { Carga } from '@/components/ui/Carga';
import { Janela } from '@/components/ui/Janela';
import { Coluna, Tabela } from '@/components/ui/Tabela';
import { useApi } from '@/hooks/useApi';
import { useFormulario } from '@/hooks/useFormulario';
import { api } from '@/lib/api';
import { paraIso } from '@/lib/formatacao';
import type { Laboratorio } from '@/lib/tipos';

type Acao = { tipo: 'novo' } | { tipo: 'bloquear'; laboratorio: Laboratorio } | { tipo: 'desativar'; laboratorio: Laboratorio };

function NovoLaboratorio({ aoConcluir, aoFechar }: { aoConcluir: () => void; aoFechar: () => void }) {
  const inicial = { nome: '', tipo: '', capacidade: '20', recursos: '', abertura: '08:00', fechamento: '18:00' };
  const { valores, alterar, erro, enviando, submeter } = useFormulario(inicial, async (dados) => {
    await api('/laboratorios', { method: 'POST', corpo: { ...dados, capacidade: Number(dados.capacidade) } });
    aoConcluir();
  });

  return (
    <Janela titulo="Novo laboratório" aoFechar={aoFechar}>
      <form onSubmit={submeter} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo rotulo="Nome" required value={valores.nome} aoAlterar={alterar('nome')} />
        </div>
        <Campo rotulo="Tipo" required value={valores.tipo} aoAlterar={alterar('tipo')} />
        <Campo rotulo="Capacidade" type="number" min={1} required value={valores.capacidade} aoAlterar={alterar('capacidade')} />
        <div className="sm:col-span-2">
          <Campo rotulo="Recursos" value={valores.recursos} aoAlterar={alterar('recursos')} />
        </div>
        <Campo rotulo="Abertura" type="time" required value={valores.abertura} aoAlterar={alterar('abertura')} />
        <Campo rotulo="Fechamento" type="time" required value={valores.fechamento} aoAlterar={alterar('fechamento')} />
        {erro && (
          <div className="sm:col-span-2">
            <Aviso tipo="erro">{erro}</Aviso>
          </div>
        )}
        <div className="flex justify-end gap-2 sm:col-span-2">
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

function BloquearHorario({ laboratorio, aoConcluir, aoFechar }: { laboratorio: Laboratorio; aoConcluir: () => void; aoFechar: () => void }) {
  const inicial = { data: '', inicio: '08:00', fim: '12:00', motivo: '' };
  const { valores, alterar, erro, enviando, submeter } = useFormulario(inicial, async (dados) => {
    await api(`/laboratorios/${laboratorio.id}/bloqueios`, {
      method: 'POST',
      corpo: { inicio: paraIso(dados.data, dados.inicio), fim: paraIso(dados.data, dados.fim), motivo: dados.motivo },
    });
    aoConcluir();
  });

  return (
    <Janela titulo={`Bloquear horário: ${laboratorio.nome}`} aoFechar={aoFechar}>
      <form onSubmit={submeter} className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="Data" type="date" required value={valores.data} aoAlterar={alterar('data')} />
        <Campo rotulo="Início" type="time" required value={valores.inicio} aoAlterar={alterar('inicio')} />
        <Campo rotulo="Fim" type="time" required value={valores.fim} aoAlterar={alterar('fim')} />
        <div className="sm:col-span-3">
          <Campo rotulo="Motivo" required value={valores.motivo} aoAlterar={alterar('motivo')} />
        </div>
        {erro && (
          <div className="sm:col-span-3">
            <Aviso tipo="erro">{erro}</Aviso>
          </div>
        )}
        <div className="flex justify-end gap-2 sm:col-span-3">
          <Botao variante="secundario" onClick={aoFechar}>
            Voltar
          </Botao>
          <Botao type="submit" disabled={enviando}>
            Bloquear
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

function Desativar({ laboratorio, aoConcluir, aoFechar }: { laboratorio: Laboratorio; aoConcluir: () => void; aoFechar: () => void }) {
  const futuras = useApi<{ quantidade: number }>(`/laboratorios/${laboratorio.id}/reservas-futuras`);
  return (
    <ConfirmacaoDeAcao
      titulo="Desativar laboratório"
      rotuloConfirmar="Desativar"
      mensagem={
        <Carga carregando={futuras.carregando} erro={futuras.erro}>
          <p>
            {laboratorio.nome} deixará de aparecer na agenda e de aceitar reservas. Reservas futuras ativas: <strong>{futuras.dados?.quantidade}</strong>.
          </p>
        </Carga>
      }
      aoConfirmar={async () => {
        await api(`/laboratorios/${laboratorio.id}/desativar`, { method: 'POST' });
        aoConcluir();
      }}
      aoFechar={aoFechar}
    />
  );
}

export default function Laboratorios() {
  const laboratorios = useApi<Laboratorio[]>('/laboratorios');
  const [acao, setAcao] = useState<Acao | null>(null);
  const fechar = () => setAcao(null);
  const concluir = () => {
    fechar();
    laboratorios.recarregar();
  };

  const colunas: Coluna<Laboratorio>[] = [
    { titulo: 'Nome', celula: (lab) => <span className="font-medium">{lab.nome}</span> },
    { titulo: 'Tipo', celula: (lab) => lab.tipo },
    { titulo: 'Capacidade', celula: (lab) => `${lab.capacidade} lugares` },
    { titulo: 'Funcionamento', celula: (lab) => `${lab.abertura} às ${lab.fechamento}` },
    { titulo: 'Recursos', celula: (lab) => lab.recursos },
    {
      titulo: '',
      celula: (lab) => (
        <div className="flex gap-2">
          <Botao tamanho="sm" variante="secundario" onClick={() => setAcao({ tipo: 'bloquear', laboratorio: lab })}>
            Bloquear horário
          </Botao>
          <Botao tamanho="sm" variante="secundario" onClick={() => setAcao({ tipo: 'desativar', laboratorio: lab })}>
            Desativar
          </Botao>
        </div>
      ),
    },
  ];

  return (
    <Cartao
      titulo="Laboratórios"
      acoes={
        <Botao tamanho="sm" onClick={() => setAcao({ tipo: 'novo' })}>
          Novo laboratório
        </Botao>
      }
    >
      <Carga carregando={laboratorios.carregando} erro={laboratorios.erro}>
        <Tabela dados={laboratorios.dados ?? []} colunas={colunas} chave={(lab) => lab.id} vazio="Nenhum laboratório cadastrado." />
      </Carga>
      {acao?.tipo === 'novo' && <NovoLaboratorio aoConcluir={concluir} aoFechar={fechar} />}
      {acao?.tipo === 'bloquear' && <BloquearHorario laboratorio={acao.laboratorio} aoConcluir={concluir} aoFechar={fechar} />}
      {acao?.tipo === 'desativar' && <Desativar laboratorio={acao.laboratorio} aoConcluir={concluir} aoFechar={fechar} />}
    </Cartao>
  );
}
