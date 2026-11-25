'use client';

import { ReactNode, useState } from 'react';
import { Aviso } from './ui/Aviso';
import { Botao } from './ui/Botao';
import { Janela } from './ui/Janela';

type Props = {
  titulo: string;
  mensagem: ReactNode;
  rotuloConfirmar: string;
  aoConfirmar: () => Promise<void>;
  aoFechar: () => void;
};

export function ConfirmacaoDeAcao({ titulo, mensagem, rotuloConfirmar, aoConfirmar, aoFechar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const confirmar = async () => {
    setProcessando(true);
    setErro(null);
    await aoConfirmar()
      .then(aoFechar)
      .catch((falha: Error) => setErro(falha.message))
      .finally(() => setProcessando(false));
  };

  return (
    <Janela titulo={titulo} aoFechar={aoFechar}>
      <div className="space-y-4 text-sm text-slate-700">
        <div>{mensagem}</div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={aoFechar}>
            Voltar
          </Botao>
          <Botao variante="perigo" onClick={confirmar} disabled={processando}>
            {rotuloConfirmar}
          </Botao>
        </div>
      </div>
    </Janela>
  );
}
